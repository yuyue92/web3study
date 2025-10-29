
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
// 空状态组件
export default function EmptyState({ icon, title, description, buttonText = "连接钱包" }) {
    const { isConnected } = useAccount();
    const { openConnectModal } = useConnectModal(); // 关键
    const ensureWallet = async () => {
        if (!isConnected) {
            // SSR 或尚未挂载时，可能是 undefined，先判空
            openConnectModal?.();
            return;
        }
        console.log('// 已连接，继续你的逻辑')
    };
    return (
        <div className="bg-slate-800/60 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center mx-auto">
            <div className="text-5xl mb-6">{icon}</div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">{description}</p>
            <button onClick={ensureWallet} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:-translate-y-1">
                {buttonText}
            </button>
        </div>
    );
}