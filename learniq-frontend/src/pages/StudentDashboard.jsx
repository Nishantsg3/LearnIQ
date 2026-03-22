import Navbar from '../components/Navbar'
import { getUserName } from '../utils/auth'

const StudentDashboard = () => {
  const name = getUserName()
  const firstName = name ? name.split(' ')[0] : 'Student'

  const mainTests = [
    {
      name: 'Java Full Stack — Batch A',
      category: 'Java',
      duration: 60,
      questions: 30,
      status: 'live',
      time: 'Ends in 2h 14m'
    },
    {
      name: 'Python Aptitude Round 2',
      category: 'Python',
      duration: 45,
      questions: 25,
      status: 'upcoming',
      time: 'Starts 28 Mar 2026'
    },
  ]

  const practiceTests = [
    { name: 'Java Basics', category: 'Java', questions: 20, difficulty: 'Easy' },
    { name: 'Java OOP Concepts', category: 'Java', questions: 25, difficulty: 'Medium' },
    { name: 'Python Fundamentals', category: 'Python', questions: 20, difficulty: 'Easy' },
    { name: 'Python Data Structures', category: 'Python', questions: 20, difficulty: 'Medium' },
    { name: 'Cloud Concepts', category: 'Cloud', questions: 15, difficulty: 'Easy' },
    { name: '.NET Essentials', category: '.NET', questions: 20, difficulty: 'Medium' },
  ]

  const recentResults = [
    { test: 'Java Basics', score: 88, total: 100, date: '20 Mar', status: 'Pass' },
    { test: 'Python Fundamentals', score: 74, total: 100, date: '18 Mar', status: 'Pass' },
    { test: 'Cloud Concepts', score: 61, total: 100, date: '15 Mar', status: 'Pass' },
  ]

  return (
    <div>
      <Navbar />
      <div className="dashboard">
        <div style={{marginBottom:'24px'}}>
          <h1>Welcome back, {firstName}!</h1>
          <p className="page-sub">Practice anytime — main tests run as per your institute's schedule</p>
        </div>

        <div className="stats-grid three">
          <div className="stat-card">
            <div className="stat-label">Tests attempted</div>
            <div className="stat-value">{recentResults.length}</div>
            <div style={{fontSize:'11px', color:'#bbb', marginTop:'4px'}}>total attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Best score</div>
            <div className="stat-value">88%</div>
            <div style={{fontSize:'11px', color:'#bbb', marginTop:'4px'}}>Java Basics</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg score</div>
            <div className="stat-value">74%</div>
            <div style={{fontSize:'11px', color:'#bbb', marginTop:'4px'}}>across all tests</div>
          </div>
        </div>

        {/* Section 2 — Main Aptitude */}
        <div className="section-header">
          <div>
            <h2>Section 2 — Main Aptitude</h2>
          </div>
          <span className="section-tag">Scheduled by admin</span>
        </div>
        <div className="test-cards-grid">
          {mainTests.map((t, i) => (
            <div className={`test-card ${t.status === 'live' ? 'live' : ''}`} key={i}>
              <div className="test-card-top">
                <div>
                  <div className="test-card-name">{t.name}</div>
                  <div style={{fontSize:'11px', color:'#999', marginTop:'2px'}}>{t.category}</div>
                </div>
                <span className={t.status === 'live' ? 'pill pill-live' : 'pill pill-upcoming'}>
                  {t.status === 'live' ? 'Live now' : 'Upcoming'}
                </span>
              </div>
              <div className="test-card-meta">{t.duration} mins · {t.questions} questions</div>
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

        {/* Section 1 — Practice */}
        <div className="section-header" style={{marginTop:'24px'}}>
          <h2>Section 1 — Practice Aptitude</h2>
          <span style={{fontSize:'11px', color:'#aaa'}}>Always available · No time limit</span>
        </div>
        <div className="table-wrap">
          <div className="table-head" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr 100px'}}>
            <span>Test name</span>
            <span>Category</span>
            <span>Questions</span>
            <span>Difficulty</span>
            <span>Action</span>
          </div>
          {practiceTests.map((t, i) => (
            <div className="table-row" key={i} style={{gridTemplateColumns:'2fr 1fr 1fr 1fr 100px'}}>
              <span style={{fontWeight:'500'}}>{t.name}</span>
              <span className="cell-muted">{t.category}</span>
              <span className="cell-muted">{t.questions}</span>
              <span>
                <span className={`pill ${t.difficulty === 'Easy' ? 'pill-done' : 'pill-live'}`}>
                  {t.difficulty}
                </span>
              </span>
              <button className="btn-attempt">Start</button>
            </div>
          ))}
        </div>

        {/* Recent Results */}
        <div className="section-header" style={{marginTop:'24px'}}>
          <h2>Recent results</h2>
          <span style={{fontSize:'11px', color:'#aaa'}}>Last 3 attempts</span>
        </div>
        <div className="table-wrap">
          <div className="table-head" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr'}}>
            <span>Test</span>
            <span>Score</span>
            <span>Date</span>
            <span>Result</span>
          </div>
          {recentResults.map((r, i) => (
            <div className="table-row" key={i} style={{gridTemplateColumns:'2fr 1fr 1fr 1fr'}}>
              <span style={{fontWeight:'500'}}>{r.test}</span>
              <span style={{color:'#7c3aed', fontWeight:'500'}}>{r.score}/{r.total}</span>
              <span className="cell-muted">{r.date}</span>
              <span><span className="pill pill-done">{r.status}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard