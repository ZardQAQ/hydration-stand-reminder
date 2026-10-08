import { useEffect, useRef, useState } from 'react'
import { MONITOR_POLL_MS } from '@shared/constants'
import { formatBytes, formatNetSpeed, formatUptime } from '@shared/format'
import type { SystemInfo } from '@shared/types'
import { api } from '../../api/client'
import { MonitorGaugeCard } from '../../components/gauges/GaugeCards'

export default function MonitorPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [updated, setUpdated] = useState('--')
  const fetchingRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const update = async () => {
      if (fetchingRef.current) return
      fetchingRef.current = true
      try {
        const data = await api.getSystemInfo()
        if (!cancelled) {
          setInfo(data)
          setUpdated(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
        }
      } catch (e) {
        console.error('Monitor update failed:', e)
      } finally {
        fetchingRef.current = false
      }
    }

    void update()
    const timer = setInterval(() => void update(), MONITOR_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const cpuUsage = info ? Number(info.cpu.usage) : 0
  const memUsage = info ? Number(info.mem.usage) : 0
  const diskUsage = info ? Number(info.disk.usage || 0) : 0
  const gpuUsage = (info?.gpu.usage || 0) / 100
  const tempRatio = info?.cpuTemp ? Math.min(info.cpuTemp.main / (info.cpuTemp.max || 100), 1) : 0
  const batRatio = info?.battery ? info.battery.percent / 100 : 0

  return (
    <section id="tab-monitor" className="tab-page active">
      <div className="monitor-overview">
        <div className="monitor-overview-item">
          <span>CPU</span>
          <strong>{info ? info.cpu.usage + '%' : '--%'}</strong>
        </div>
        <div className="monitor-overview-item">
          <span>内存</span>
          <strong>{info ? info.mem.usage + '%' : '--%'}</strong>
        </div>
        <div className="monitor-overview-item">
          <span>温度</span>
          <strong>{info?.cpuTemp ? info.cpuTemp.main + '°C' : '--°C'}</strong>
        </div>
      </div>
      <div className="monitor-grid">
        <MonitorGaugeCard
          arcClass="cpu-arc"
          value={info ? info.cpu.usage + '%' : '--%'}
          ratio={cpuUsage / 100}
          footer={<span className="monitor-detail">{info ? `用户 ${info.cpu.breakdown.user}%  ·  系统 ${info.cpu.breakdown.system}%  ·  空闲 ${info.cpu.breakdown.idle}%` : '用户 --%  ·  系统 --%  ·  空闲 --%'}</span>}
        >
          <div className="monitor-header">
            <div className="monitor-icon cpu-icon">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
                <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3>CPU</h3>
              <p className="monitor-sub">{info ? info.cpu.cores + ' 核心' : '处理器'}</p>
            </div>
          </div>
        </MonitorGaugeCard>

        <MonitorGaugeCard
          arcClass="gpu-arc"
          value={
            info && info.gpu.usage != null ? `${info.gpu.usage}%` : 'N/A'
          }
          ratio={gpuUsage}
          footer={
            <span className="monitor-detail">
              {info && info.gpu.memUsed != null && info.gpu.memTotal != null
                ? `显存 ${formatBytes(info.gpu.memUsed * 1024 * 1024)} / ${formatBytes(info.gpu.memTotal * 1024 * 1024)}`
                : '显存 -- / --'}
            </span>
          }
        >
          <div className="monitor-header">
            <div className="monitor-icon gpu-icon">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="12" r="2" fill="currentColor" opacity="0.3" />
                <circle cx="16" cy="12" r="2" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            <div>
              <h3>GPU</h3>
              <p className="monitor-sub">{info?.gpu.name || '显卡'}</p>
            </div>
          </div>
        </MonitorGaugeCard>

        <MonitorGaugeCard
          arcClass="mem-arc"
          value={info ? info.mem.usage + '%' : '--%'}
          ratio={memUsage / 100}
          footer={
            <span className="monitor-detail">
              {info
                ? `${formatBytes(info.mem.used)} / ${formatBytes(info.mem.total)}${info.mem.swapTotal > 0 ? `  ·  交换: ${formatBytes(info.mem.swapUsed || 0)} / ${formatBytes(info.mem.swapTotal)}` : ''}`
                : '-- / --  ·  交换: -- / --'}
            </span>
          }
        >
          <div className="monitor-header">
            <div className="monitor-icon mem-icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 9h2v4h-2zM10 9h4v4h-4zM16 9h1v4h-1z" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            <div>
              <h3>内存</h3>
              <p className="monitor-sub">{info ? `${formatBytes(info.mem.used)} / ${formatBytes(info.mem.total)}` : 'RAM'}</p>
            </div>
          </div>
        </MonitorGaugeCard>

        <MonitorGaugeCard
          arcClass="disk-arc"
          value={info ? (info.disk.usage || 0) + '%' : '--%'}
          ratio={diskUsage / 100}
          footer={
            <span className="monitor-detail">
              {info
                ? `${formatBytes(info.disk.used)} / ${formatBytes(info.disk.total)}  ·  ${info.disk.count || 0} 个分区`
                : '-- / --  ·  -- 个分区'}
            </span>
          }
        >
          <div className="monitor-header">
            <div className="monitor-icon disk-icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 14h18" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="8" r="1.5" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            <div>
              <h3>硬盘</h3>
              <p className="monitor-sub">磁盘</p>
            </div>
          </div>
        </MonitorGaugeCard>

        <article className="monitor-card">
          <div className="monitor-header">
            <div className="monitor-icon net-icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 12h20" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <h3>网络</h3>
              <p className="monitor-sub">实时速率</p>
            </div>
          </div>
          <div className="monitor-net-grid">
            <div className="net-item down">
              <span className="net-arrow">&#11015;</span>
              <span className="net-value">{info ? formatNetSpeed(info.network.down) : '-- KB/s'}</span>
              <span className="net-label">下载</span>
            </div>
            <div className="net-item up">
              <span className="net-arrow">&#11014;</span>
              <span className="net-value">{info ? formatNetSpeed(info.network.up) : '-- KB/s'}</span>
              <span className="net-label">上传</span>
            </div>
          </div>
        </article>

        <article className="monitor-card">
          <div className="monitor-header">
            <div className="monitor-icon sys-icon">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3>系统</h3>
              <p className="monitor-sub">运行信息</p>
            </div>
          </div>
          <div className="monitor-sys-grid two-col">
            <div className="sys-item">
              <span className="sys-value">{info?.uptime ? formatUptime(info.uptime) : '--'}</span>
              <span className="sys-label">运行时间</span>
            </div>
            <div className="sys-item">
              <span className="sys-value">{info?.sysOS || '--'}</span>
              <span className="sys-label">操作系统</span>
            </div>
          </div>
        </article>

        <MonitorGaugeCard
          arcClass="temp-arc"
          value={info?.cpuTemp ? info.cpuTemp.main + '°C' : '--°C'}
          ratio={tempRatio}
          footer={<span className="monitor-detail">{info?.cpuTemp ? `最高 ${info.cpuTemp.max || 100}°C` : '无传感器'}</span>}
        >
          <div className="monitor-header">
            <div className="monitor-icon temp-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2v12M12 2C8 7 6 9.5 6 14a6 6 0 0 0 12 0c0-4.5-2-7-6-12z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="14" r="3" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            <div>
              <h3>温度</h3>
              <p className="monitor-sub">{info?.cpuTemp?.cores ? info.cpuTemp.cores.length + ' 核心' : 'CPU'}</p>
            </div>
          </div>
        </MonitorGaugeCard>

        <article className="monitor-card">
          <div className="monitor-header">
            <div className="monitor-icon cpu-icon">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
                <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3>CPU</h3>
              <p className="monitor-sub">处理器详情</p>
            </div>
          </div>
          <div className="monitor-sys-grid two-col">
            <div className="sys-item">
              <span className="sys-value">
                {info?.cpuStatic?.brand
                  ? info.cpuStatic.brand.replace(/^Intel\(R\) |^AMD /, '').replace(/ CPU.*$/, '').substring(0, 18)
                  : '--'}
              </span>
              <span className="sys-label">型号</span>
            </div>
            <div className="sys-item">
              <span className="sys-value">
                {info?.cpuStatic
                  ? `${info.cpuStatic.physicalCores || info.cpuStatic.cores || '--'} / ${info.cpuStatic.cores || '--'}`
                  : '--'}
              </span>
              <span className="sys-label">核心 / 线程</span>
            </div>
            <div className="sys-item">
              <span className="sys-value">{info?.cpuStatic?.speed ? info.cpuStatic.speed + ' GHz' : '--'}</span>
              <span className="sys-label">频率 (GHz)</span>
            </div>
            <div className="sys-item">
              <span className="sys-value">
                {info?.cpuStatic
                  ? `${info.cpuStatic.speedMin || '--'} / ${info.cpuStatic.speedMax || '--'} GHz`
                  : '--'}
              </span>
              <span className="sys-label">基频 / 最大</span>
            </div>
          </div>
        </article>

        <MonitorGaugeCard
          arcClass="bat-arc"
          value={info?.battery ? info.battery.percent + '%' : '--%'}
          ratio={batRatio}
          footer={
            <span className="monitor-detail">
              {info?.battery
                ? (() => {
                    let detail = info.battery!.isCharging ? '充电中' : '放电中'
                    if (info.battery!.timeRemaining != null && info.battery!.timeRemaining > 0) {
                      const h = Math.floor(info.battery!.timeRemaining / 3600)
                      const m = Math.floor((info.battery!.timeRemaining % 3600) / 60)
                      detail += `  ·  剩余 ${h}h ${m}m`
                    }
                    return detail
                  })()
                : '无电池'}
            </span>
          }
        >
          <div className="monitor-header">
            <div className="monitor-icon bat-icon">
              <svg viewBox="0 0 24 24">
                <rect x="6" y="3" width="12" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 6h6M9 9h4M9 12h5M9 15h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <rect x="8" y="22" width="8" height="2" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <h3>电池</h3>
              <p className="monitor-sub">{info?.battery?.model || '电池状态'}</p>
            </div>
          </div>
        </MonitorGaugeCard>
      </div>
      <p className="monitor-updated">最后更新：{updated}</p>
    </section>
  )
}
