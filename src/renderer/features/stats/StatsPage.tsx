import { useEffect, useRef, useState } from 'react'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js'
import type { HistoryRecord } from '@shared/types'
import { api } from '../../api/client'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  LineController,
  LineElement,
  PointElement,
  Filler
)

function chartTextColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--muted').trim()
}

function baseChartOptions(textColor: string) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle' as const,
          pointStyleWidth: 8
        }
      }
    },
    scales: {
      x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
      y: {
        ticks: { color: textColor, font: { size: 10 }, stepSize: 1 },
        grid: { color: textColor + '20' },
        beginAtZero: true
      }
    }
  }
}

function buildTodayHourlyData(records: HistoryRecord[], todayStart: number) {
  const waterByHour = new Array(24).fill(0)
  const standByHour = new Array(24).fill(0)
  records.forEach((r) => {
    if (r.at < todayStart) return
    const hour = new Date(r.at).getHours()
    if (r.type === 'water') waterByHour[hour]++
    else if (r.type === 'stand') standByHour[hour]++
  })
  return {
    labels: Array.from({ length: 24 }, (_, h) => `${h}时`),
    water: waterByHour,
    stand: standByHour
  }
}

function lineDatasets(waterData: number[], standData: number[], pointRadius = 4) {
  return [
    {
      label: '喝水',
      data: waterData,
      borderColor: '#0d7e6f',
      backgroundColor: 'rgba(13,126,111,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius,
      pointBackgroundColor: '#0d7e6f',
      borderWidth: 2.5
    },
    {
      label: '站立',
      data: standData,
      borderColor: '#d4583a',
      backgroundColor: 'rgba(212,88,58,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius,
      pointBackgroundColor: '#d4583a',
      borderWidth: 2.5
    }
  ]
}

export default function StatsPage() {
  const todayChartRef = useRef<HTMLCanvasElement>(null)
  const barChartRef = useRef<HTMLCanvasElement>(null)
  const lineChartRef = useRef<HTMLCanvasElement>(null)
  const chartsRef = useRef<{ today?: Chart; bar?: Chart; line?: Chart }>({})
  const [counts, setCounts] = useState({ todayW: 0, todayS: 0, weekW: 0, weekS: 0 })

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const records = await api.getHistory()
      if (!mounted) return

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const weekStart = todayStart - now.getDay() * 86400000

      let todayW = 0
      let todayS = 0
      let weekW = 0
      let weekS = 0
      records.forEach((r) => {
        if (r.at >= todayStart) {
          if (r.type === 'water') todayW++
          else if (r.type === 'stand') todayS++
        }
        if (r.at >= weekStart) {
          if (r.type === 'water') weekW++
          else if (r.type === 'stand') weekS++
        }
      })
      setCounts({ todayW, todayS, weekW, weekS })

      const todayHourly = buildTodayHourlyData(records, todayStart)
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        const dayStart = d.getTime()
        const dayEnd = dayStart + 86400000
        const w = records.filter((r) => r.type === 'water' && r.at >= dayStart && r.at < dayEnd).length
        const s = records.filter((r) => r.type === 'stand' && r.at >= dayStart && r.at < dayEnd).length
        days.push({ label: d.getMonth() + 1 + '/' + d.getDate(), water: w, stand: s })
      }

      const labels = days.map((d) => d.label)
      const waterData = days.map((d) => d.water)
      const standData = days.map((d) => d.stand)
      const textColor = chartTextColor()
      const options = baseChartOptions(textColor)

      const upsertLine = (
        key: 'today' | 'line',
        canvas: HTMLCanvasElement | null,
        lbls: string[],
        water: number[],
        stand: number[],
        pointRadius = 4
      ) => {
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const existing = chartsRef.current[key]
        if (existing) {
          existing.data.labels = lbls
          existing.data.datasets[0].data = water
          existing.data.datasets[1].data = stand
          existing.options = options
          existing.update()
          return
        }
        chartsRef.current[key] = new Chart(ctx, {
          type: 'line',
          data: { labels: lbls, datasets: lineDatasets(water, stand, pointRadius) },
          options
        })
      }

      upsertLine('today', todayChartRef.current, todayHourly.labels, todayHourly.water, todayHourly.stand, 3)

      const barCanvas = barChartRef.current
      if (barCanvas) {
        const ctx = barCanvas.getContext('2d')
        if (ctx) {
          const datasets = [
            {
              label: '喝水',
              data: waterData,
              backgroundColor: '#0d7e6f',
              borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
              maxBarThickness: 28
            },
            {
              label: '站立',
              data: standData,
              backgroundColor: '#d4583a',
              borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
              maxBarThickness: 28
            }
          ]
          if (chartsRef.current.bar) {
            chartsRef.current.bar.data.labels = labels
            chartsRef.current.bar.data.datasets[0].data = waterData
            chartsRef.current.bar.data.datasets[1].data = standData
            chartsRef.current.bar.options = options
            chartsRef.current.bar.update()
          } else {
            chartsRef.current.bar = new Chart(ctx, { type: 'bar', data: { labels, datasets }, options })
          }
        }
      }

      upsertLine('line', lineChartRef.current, labels, waterData, standData)
    }

    void load()

    return () => {
      mounted = false
      chartsRef.current.today?.destroy()
      chartsRef.current.bar?.destroy()
      chartsRef.current.line?.destroy()
      chartsRef.current = {}
    }
  }, [])

  return (
    <section id="tab-stats" className="tab-page active">
      <div className="stats-area">
        <div className="stats-row">
          <div className="stat-item water">
            <span className="stat-num">{counts.todayW}</span>
            <span className="stat-label">今日喝水</span>
          </div>
          <div className="stat-item stand">
            <span className="stat-num">{counts.todayS}</span>
            <span className="stat-label">今日站立</span>
          </div>
          <div className="stat-item water">
            <span className="stat-num">{counts.weekW}</span>
            <span className="stat-label">本周喝水</span>
          </div>
          <div className="stat-item stand">
            <span className="stat-num">{counts.weekS}</span>
            <span className="stat-label">本周站立</span>
          </div>
        </div>
        <div className="chart-block chart-block-full">
          <h3>今日统计</h3>
          <div className="chart-wrap chart-wrap-today">
            <canvas ref={todayChartRef} />
          </div>
        </div>
        <div className="charts-row">
          <div className="chart-block">
            <h3>近 7 天统计</h3>
            <div className="chart-wrap">
              <canvas ref={barChartRef} />
            </div>
          </div>
          <div className="chart-block">
            <h3>趋势</h3>
            <div className="chart-wrap">
              <canvas ref={lineChartRef} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
