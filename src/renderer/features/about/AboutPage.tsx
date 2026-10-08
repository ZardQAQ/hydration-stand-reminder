import appIcon from '../../assets/icon.png'

export default function AboutPage() {
  return (
    <section id="tab-about" className="tab-page active">
      <div className="about-area">
        <div className="about-hero">
          <div className="about-avatar">
            <img src={appIcon} alt="桌面效率工具箱" />
          </div>
          <h1 className="about-name">桌面效率工具箱</h1>
          <p className="about-tagline">记得喝水，健康工作</p>
        </div>
        <div className="about-section">
          <h3>关于我</h3>
          <p>
            作为一名长期伏案工作的开发者，我深知久坐和忘记喝水对身体的伤害。每天面对电脑屏幕，经常一忙就是几个小时，等到口渴时才想起喝水，等到腰酸背痛才意识到该起身活动。这个工具的诞生源于我自己的切身需求——我希望有一个简单、直观且可靠的提醒助手，能够在我专注工作时提醒我。没有复杂的功能，没有繁琐的设置，只有恰到好处的提醒，让健康习惯自然融入日常工作流中。
          </p>
        </div>
        <div className="about-section">
          <h3>技能 & 工具</h3>
          <div className="about-tags">
            {['JavaScript', 'Python', 'Electron', 'React', 'Node.js', 'Git'].map((tag) => (
              <span key={tag} className="about-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="about-section">
          <h3>联系方式</h3>
          <div className="about-contact">
            <div className="about-contact-item">
              <span className="contact-icon">&#9993;</span>
              <span>3345972086@qq.com</span>
            </div>
          </div>
        </div>
        <div className="about-footer">
          <p>桌面效率工具箱 v2.0 · 用 Electron 构建</p>
        </div>
      </div>
    </section>
  )
}
