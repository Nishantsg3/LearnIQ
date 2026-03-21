import Navbar from '../components/Navbar'

const AdminDashboard = () => {
  const stats = [
    { label: 'Students', value: '—' },
    { label: 'Tests created', value: '—' },
    { label: 'Questions', value: '—' },
    { label: 'Scheduled', value: '—' },
  ]

  const scheduledTests = [
    { name: 'Java Full Stack — Batch A', category: 'Java', date: '25 Mar', status: 'live' },
    { name: 'Python Aptitude Round 2', category: 'Python', date: '28 Mar', status: 'upcoming' },
    { name: 'Cloud Fundamentals', category: 'Cloud', date: '02 Apr', status: 'upcoming' },
  ]

  const recentStudents = [
    { name: 'Tapesh Gaur', email: 'tapesh@example.com' },
    { name: 'Priya Sharma', email: 'priya@example.com' },
    { name: 'Rahul Mehta', email: 'rahul@example.com' },
  ]

  return (
    <div>
      <Navbar />
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p className="page-sub">Overview of your institute's test activity</p>

        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="section-header">
          <h2>Upcoming scheduled tests</h2>
          <button className="btn-small">+ Schedule test</button>
        </div>
        <div className="table-wrap">
          <div className="table-head" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr'}}>
            <span>Test name</span><span>Category</span><span>Date</span><span>Status</span>
          </div>
          {scheduledTests.map((t, i) => (
            <div className="table-row" key={i} style={{gridTemplateColumns:'2fr 1fr 1fr 1fr'}}>
              <span>{t.name}</span>
              <span className="cell-muted">{t.category}</span>
              <span className="cell-muted">{t.date}</span>
              <span>
                <span className={t.status === 'live' ? 'pill pill-live' : 'pill pill-upcoming'}>
                  {t.status === 'live' ? 'Live soon' : 'Upcoming'}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="section-header">
          <h2>Recent students</h2>
          <span className="section-tag">Students only</span>
        </div>
        <div className="table-wrap">
          <div className="table-head" style={{gridTemplateColumns:'2fr 3fr 1fr'}}>
            <span>Name</span><span>Email</span><span>Role</span>
          </div>
          {recentStudents.map((s, i) => (
            <div className="table-row" key={i} style={{gridTemplateColumns:'2fr 3fr 1fr'}}>
              <span>{s.name}</span>
              <span className="cell-muted">{s.email}</span>
              <span><span className="pill pill-student">Student</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard