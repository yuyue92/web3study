import { create } from 'zustand'

export const useWallet = create((set, get) => ({
    walletConnected: false,
    setWalletConnected: (status) => set({ walletConnected: status }),
    getWalletConnected: () => get().walletConnected,
    // 全局钱包状态：address / chainId / jwt
    status: 'disconnected',
    address: null,
    chainId: null,
    connectorName: null,
    setWallet: (p) => set(p),
    jwt: null,
    // setters
    setAddress: (address) => set({ address }),
    setChainId: (chainId) => set({ chainId }),
    setJwt: (jwt) => set({ jwt }),
    getWallet: () => {
        const { address, chainId, jwt } = get();
        return { address, chainId, jwt };
    },
    reset: () => set({
        status: 'disconnected',
        address: null,
        chainId: null,
        connectorName: null,
    })

}))

// export const useWallet = create((set, get) => ({
//     address: null,
// }))