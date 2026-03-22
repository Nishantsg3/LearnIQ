import Navbar from '../components/Navbar'

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Students', value: '—', note: 'registered' },
    { label: 'Tests Created', value: '—', note: 'in question bank' },
    { label: 'Questions', value: '—', note: 'across all categories' },
    { label: 'Scheduled', value: '—', note: 'upcoming tests' },
  ]

  const scheduledTests = [
    { name: 'Java Full Stack — Batch A', category: 'Java', date: '25 Mar 2026', duration: '60 mins', status: 'live' },
    { name: 'Python Aptitude Round 2', category: 'Python', date: '28 Mar 2026', duration: '45 mins', status: 'upcoming' },
    { name: 'Cloud Fundamentals', category: 'Cloud', date: '02 Apr 2026', duration: '30 mins', status: 'upcoming' },
  ]

  const recentStudents = [
    { name: 'Tapesh Gaur', email: 'tapesh@example.com', joined: '21 Mar' },
    { name: 'Priya Sharma', email: 'priya@example.com', joined: '20 Mar' },
    { name: 'Rahul Mehta', email: 'rahul@example.com', joined: '19 Mar' },
  ]

  return (
    <div>
      <Navbar />
      <div className="dashboard">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
          <div>
            <h1>Dashboard</h1>
            <p className="page-sub">LearnIQ — Online Aptitude Test System</p>
          </div>
          <div style={{display:'flex', gap:'8px'}}>
            <button className="btn-small">+ Add Question</button>
            <button className="btn-attempt" style={{fontSize:'13px', padding:'8px 16px'}}>+ Create Test</button>
          </div>
        </div>

        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div style={{fontSize:'11px', color:'#bbb', marginTop:'4px'}}>{s.note}</div>
            </div>
          ))}
        </div>

        <div className="section-header">
          <h2>Scheduled tests</h2>
          <button className="btn-small">+ Schedule test</button>
        </div>
        <div className="table-wrap">
          <div className="table-head" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr'}}>
            <span>Test name</span>
            <span>Category</span>
            <span>Date</span>
            <span>Duration</span>
            <span>Status</span>
          </div>
          {scheduledTests.map((t, i) => (
            <div className="table-row" key={i} style={{gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr'}}>
              <span style={{fontWeight:'500'}}>{t.name}</span>
              <span className="cell-muted">{t.category}</span>
              <span className="cell-muted">{t.date}</span>
              <span className="cell-muted">{t.duration}</span>
              <span>
                <span className={t.status === 'live' ? 'pill pill-live' : 'pill pill-upcoming'}>
                  {t.status === 'live' ? 'Live now' : 'Upcoming'}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="section-header" style={{marginTop:'24px'}}>
          <h2>Recent students</h2>
          <span className="section-tag">Students only · Admins excluded</span>
        </div>
        <div className="table-wrap">
          <div className="table-head" style={{gridTemplateColumns:'2fr 3fr 1fr 1fr'}}>
            <span>Name</span>
            <span>Email</span>
            <span>Joined</span>
            <span>Role</span>
          </div>
          {recentStudents.map((s, i) => (
            <div className="table-row" key={i} style={{gridTemplateColumns:'2fr 3fr 1fr 1fr'}}>
              <span style={{fontWeight:'500'}}>{s.name}</span>
              <span className="cell-muted">{s.email}</span>
              <span className="cell-muted">{s.joined}</span>
              <span><span className="pill pill-student">Student</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard