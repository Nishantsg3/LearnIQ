import Navbar from '../components/Navbar'
import { getUserName } from '../utils/auth'

const StudentDashboard = () => {
  const name = getUserName()

  const mainTests = [
    { name: 'Java Full Stack — Batch A', duration: 60, questions: 30, status: 'live', time: 'Ends in 2h 14m' },
    { name: 'Python Aptitude Round 2', duration: 45, questions: 25, status: 'upcoming', time: 'Starts 28 Mar' },
  ]

  const practiceTests = [
    { name: 'Java Basics', category: 'Java', questions: 20 },
    { name: 'Python Fundamentals', category: 'Python', questions: 20 },
    { name: 'Cloud Concepts', category: 'Cloud', questions: 15 },
    { name: '.NET Essentials', category: '.NET', questions: 20 },
  ]

  return (
    <div>
      <Navbar />
      <div className="dashboard">
        <h1>My tests</h1>
        <p className="page-sub">Practice anytime — main tests run as per admin schedule</p>

        <div className="stats-grid three">
          <div className="stat-card"><div className="stat-label">Tests attempted</div><div className="stat-value">—</div></div>
          <div className="stat-card"><div className="stat-label">Best score</div><div className="stat-value">—</div></div>
          <div className="stat-card"><div className="stat-label">Avg score</div><div className="stat-value">—</div></div>
        </div>

        <div className="section-header">
          <h2>Section 2 — Main aptitude tests</h2>
          <span className="section-tag">Scheduled by admin</span>
        </div>
        <div className="test-cards-grid">
          {mainTests.map((t, i) => (
            <div className={`test-card ${t.status === 'live' ? 'live' : ''}`} key={i}>
              <div className="test-card-top">
                <div className="test-card-name">{t.name}</div>
                <span className={t.status === 'live' ? 'pill pill-live' : 'pill pill-upcoming'}>
                  {t.status === 'live' ? 'Live now' : 'Upcoming'}
                </span>
              </div>
              <div className="test-card-meta">Duration: {t.duration} mins · {t.questions} questions</div>
              <div className="test-card-footer">
                <span className="test-card-time">{t.time}</span>
                {t.status === 'live'
                  ? <button className="btn-attempt">Attempt now</button>
                  : <button className="btn-disabled" disabled>Not yet open</button>
                }
              </div>
            </div>
          ))}
        </div>

        <div className="section-header">
          <h2>Section 1 — Practice tests</h2>
          <span style={{fontSize:'11px', color:'#aaa'}}>Always available</span>
        </div>
        <div className="table-wrap">
          <div className="table-head" style={{gridTemplateColumns:'2fr 1fr 1fr 100px'}}>
            <span>Test name</span><span>Category</span><span>Questions</span><span>Action</span>
          </div>
          {practiceTests.map((t, i) => (
            <div className="table-row" key={i} style={{gridTemplateColumns:'2fr 1fr 1fr 100px'}}>
              <span>{t.name}</span>
              <span className="cell-muted">{t.category}</span>
              <span className="cell-muted">{t.questions}</span>
              <button className="btn-attempt">Start</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard