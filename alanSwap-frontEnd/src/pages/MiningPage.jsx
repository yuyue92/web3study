import { useState } from "react"
import GlowCard from "./GlowCard"
import EmptyState from "./EmptyState"
import StatCard from "./StatCard"
import StakeCard from "./StakeCard"
import { useWallet } from "./useWallet"

export default function MiningPage({ stats }) {
    const { status } = useWallet();
    const [stakeDataList] = useState([
        { title: "ETH 质押池", token: "ETH", tvl: "$2.4M", days: "30天", apy: "12.5%", deposited: "1.2345 ETH", badge: '🔷' },
        { title: "USDC 稳定池", token: "USDC", tvl: "$5.8M", days: "7天", apy: "8.2%", badge: '💵' },
        { title: "UNI 治理代币池", token: "UNI", tvl: "$890K", days: "90天", apy: "18.7%", badge: '🦄' },
        { title: "LINK 预言机池", token: "LINK", tvl: "$1.2M", days: "60天", apy: "15.3%", badge: '🔗' }
    ])
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold neon-text mb-2">质押挖矿</h1>
                <p className="text-muted-foreground">质押您的代币，获得丰厚奖励</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="总质押价值" value={stats.totalStaked} change="+12.5% 本月" />
                <StatCard title="累计奖励" value={stats.rewards} change="+$5.67 本日" />
                <StatCard title="平均APY" value={`${stats.apy}%`} change="年化收益" />
            </div>

            {status === 'disconnected' ? <EmptyState
                icon="🔒"
                title="连接钱包开始质押"
                description="连接您的钱包以查看和管理质押"
            /> : (<div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">
                {stakeDataList.map(item => <StakeCard key={item.title} title={item.title} token={item.token} tvl={item.tvl} days={item.days} apy={item.apy} deposited={item.deposited} badge={item.badge} />)}
            </div>)}
            {status !== 'disconnected' && (<div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-indigo-400/20 hover:glow-purple transition-all duration-300">
                <div className="p-5 font-semibold text-lg text-glow text-black">质押统计</div>
                <div className="p-5 grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                        <div className="text-white/70 mb-2">收益分布</div>
                        <div className="space-y-2">
                            {[
                                { k: "ETH", v: "0.0234 ETH", c: "+12.5%" },
                                { k: "USDC", v: "12.45 USDC", c: "+3.2%" },
                                { k: "UNI", v: "2.34 UNI", c: "+18.7%" },
                            ].map((i) => (
                                <div key={i.k} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                    <div className="text-white/80 flex items-center gap-2">{i.k}</div>
                                    <div className="text-white/90">{i.v}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-white/70 mb-2">限期对照</div>
                        <div className="space-y-2">
                            {[
                                { k: "ETH 池", v: "1.2345 ETH" },
                                { k: "USDC 池", v: "1250.00 USDC" },
                                { k: "UNI 池", v: "45.67 UNI" },
                            ].map((i) => (
                                <div key={i.k} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                    <div className="text-white/70">{i.k}</div>
                                    <div className="text-white/90">{i.v}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>)}
        </div>
    )
}