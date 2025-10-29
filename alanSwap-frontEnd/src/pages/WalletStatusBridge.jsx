import { useAccount } from "wagmi";
import { useWallet } from "./useWallet";
import { useEffect } from "react";

export default function WalletStatusBridge() {
    const { setWallet } = useWallet();
    const { status, address, chain, connector } = useAccount();
    // 主同步：任何变化都推到 Zustand
    useEffect(() => {
        setWallet({
            status: status,
            address: address ?? null,
            chainId: chain?.id ?? null,
            connectorName: connector?.name ?? null,
        })
    }, [status, address, chain, connector, setWallet])
    return null;
}