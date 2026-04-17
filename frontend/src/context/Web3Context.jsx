import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import CONTRACT_ADDRESSES from "../config/contracts";
import RoleManagerABI from "../abis/RoleManager.json";
import AuditTrailABI from "../abis/AuditTrail.json";
import AccessControlABI from "../abis/AccessControl.json";
import RecordStorageABI from "../abis/RecordStorage.json";

const Web3Context = createContext(null);

const ROLE_NAMES = { 0: "none", 1: "admin", 2: "doctor", 3: "patient" };
const GAS_LIMIT_BUFFER_PERCENT = 20;

async function populateWriteTransaction(transaction, signer, readProvider) {
  const from = await signer.getAddress();
  const tx = await ethers.utils.resolveProperties({ ...transaction });

  if (tx.from && tx.from.toLowerCase() !== from.toLowerCase()) {
    throw new Error("Transaction from address does not match connected wallet");
  }

  tx.from = from;

  if (tx.to) {
    const resolvedTo = await readProvider.resolveName(tx.to);
    if (!resolvedTo) {
      throw new Error("Transaction recipient could not be resolved");
    }
    tx.to = resolvedTo;
  }

  const [network, nonce, feeData] = await Promise.all([
    readProvider.getNetwork(),
    tx.nonce == null ? readProvider.getTransactionCount(from, "pending") : tx.nonce,
    tx.gasPrice == null || tx.maxFeePerGas == null || tx.maxPriorityFeePerGas == null
      ? readProvider.getFeeData()
      : null,
  ]);

  if (tx.chainId == null) {
    tx.chainId = network.chainId;
  } else if (Number(tx.chainId) !== network.chainId) {
    throw new Error(`Transaction chainId ${tx.chainId} does not match RPC chainId ${network.chainId}`);
  }

  if (tx.nonce == null) {
    tx.nonce = nonce;
  }

  const wantsLegacyFee = tx.type === 0 || tx.type === 1 || tx.gasPrice != null;
  if (wantsLegacyFee) {
    if (tx.gasPrice == null) {
      tx.gasPrice = feeData?.gasPrice || (await readProvider.getGasPrice());
    }
    if (tx.type == null) {
      tx.type = 0;
    }
    delete tx.maxFeePerGas;
    delete tx.maxPriorityFeePerGas;
  } else {
    if (tx.type == null) {
      tx.type = 2;
    }
    if (tx.maxFeePerGas == null) {
      tx.maxFeePerGas = feeData?.maxFeePerGas || feeData?.gasPrice || (await readProvider.getGasPrice());
    }
    if (tx.maxPriorityFeePerGas == null) {
      tx.maxPriorityFeePerGas =
        feeData?.maxPriorityFeePerGas || feeData?.gasPrice || tx.maxFeePerGas;
    }
  }

  if (tx.gasLimit == null) {
    const estimatedGas = await readProvider.estimateGas(tx);
    tx.gasLimit = estimatedGas.mul(100 + GAS_LIMIT_BUFFER_PERCENT).div(100);
  }

  return tx;
}

function withAlchemyWritePopulation(signer, readProvider) {
  if (!readProvider) return signer;

  const originalSendTransaction = signer.sendTransaction.bind(signer);
  signer.sendTransaction = async (transaction) => {
    const populated = await populateWriteTransaction(transaction, signer, readProvider);
    return originalSendTransaction(populated);
  };

  return signer;
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [loading, setLoading] = useState(true);

  const setupAccount = useCallback(async (ethereum) => {
    try {
      const prov = new ethers.providers.Web3Provider(ethereum);

      // Route read calls through Alchemy directly, bypassing MetaMask's flaky RPC
      const ALCHEMY_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;
      let readProvider = null;
      if (ALCHEMY_URL) {
        readProvider = new ethers.providers.StaticJsonRpcProvider(ALCHEMY_URL);
        const originalSend = prov.send.bind(prov);
        const READ_METHODS = new Set([
          "eth_call",
          "eth_getBalance",
          "eth_getCode",
          "eth_getStorageAt",
          "eth_getLogs",
          "eth_getBlockByNumber",
          "eth_getBlockByHash",
          "eth_getTransactionReceipt",
          "eth_getTransactionByHash",
          "eth_blockNumber",
          "eth_estimateGas",
          "eth_gasPrice",
          "eth_feeHistory",
          "net_version",
        ]);
        prov.send = async (method, params) => {
          if (READ_METHODS.has(method)) {
            return readProvider.send(method, params);
          }
          return originalSend(method, params);
        };
      }

      const sign = withAlchemyWritePopulation(prov.getSigner(), readProvider);
      const addr = await sign.getAddress();

      const c = {
        roleManager: new ethers.Contract(CONTRACT_ADDRESSES.ROLE_MANAGER, RoleManagerABI.abi, sign),
        auditTrail: new ethers.Contract(CONTRACT_ADDRESSES.AUDIT_TRAIL, AuditTrailABI.abi, sign),
        accessControl: new ethers.Contract(CONTRACT_ADDRESSES.ACCESS_CONTROL, AccessControlABI.abi, sign),
        recordStorage: new ethers.Contract(CONTRACT_ADDRESSES.RECORD_STORAGE, RecordStorageABI.abi, sign),
      };

      const r = await c.roleManager.getRole(addr);

      setProvider(prov);
      setSigner(sign);
      setAccount(addr.toLowerCase());
      setContracts(c);
      setRole(ROLE_NAMES[Number(r)]);
      return { addr: addr.toLowerCase(), role: ROLE_NAMES[Number(r)] };
    } catch (err) {
      console.error("Setup failed:", err);
      setAccount(null);
      setRole(null);
      setContracts(null);
      return null;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask!");
      return null;
    }
    setLoading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const result = await setupAccount(window.ethereum);
      setLoading(false);
      return result;
    } catch (err) {
      console.error("Connection failed:", err);
      setLoading(false);
      return null;
    }
  }, [setupAccount]);

  const addSepoliaNetwork = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask!");
      return false;
    }
    const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      toast.error("Sepolia RPC URL not configured");
      return false;
    }
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xaa36a7",
            chainName: "Sepolia (Healthchain)",
            rpcUrls: [rpcUrl],
            nativeCurrency: { name: "Sepolia ETH", symbol: "SepETH", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
      toast.success("Sepolia network added — using reliable RPC");
      return true;
    } catch (err) {
      console.error("Failed to add network:", err);
      toast.error(err?.message || "Failed to add network");
      return false;
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (!window.ethereum || !account) return;
    await setupAccount(window.ethereum);
  }, [account, setupAccount]);

  // Auto-connect on mount if already authorized
  useEffect(() => {
    if (!window.ethereum) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          await setupAccount(window.ethereum);
        }
      } catch (err) {
        console.error("Auto-connect failed:", err);
      }
      setLoading(false);
    })();
  }, [setupAccount]);

  // Listen for account & chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setRole(null);
        setContracts(null);
        setProvider(null);
        setSigner(null);
        return;
      }
      await setupAccount(window.ethereum);
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [setupAccount]);

  return (
    <Web3Context.Provider
      value={{ account, role, contracts, provider, signer, connectWallet, refreshRole, addSepoliaNetwork, loading }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}
