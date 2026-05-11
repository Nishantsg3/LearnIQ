import React from 'react';

const AuthLayout = ({ children, panelColor = '#7c3aed', accentColor = '#a78bfa', title, description, showMobileDecorations = false }) => {
  return (
    <div className="w-full h-screen flex overflow-hidden font-sans relative" style={{ background: '#0d0d10' }}>
      {/* Background Depth Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.03)_0%,transparent_70%)] pointer-events-none" />

      {/* PREMIUM CORNER ACCENTS */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-900/5 blur-[150px] pointer-events-none rounded-full" />
      
      {/* CORNER SHARDS */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-[0.08] pointer-events-none z-0"
        style={{
          background: `linear-gradient(225deg, ${accentColor}, transparent)`,
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.05] pointer-events-none z-0"
        style={{
          background: `linear-gradient(45deg, ${accentColor}, transparent)`,
          clipPath: 'polygon(0 0, 0 100%, 100% 100%)'
        }}
      />

      {/* ── LEFT PANEL: Branding ──────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[40%] relative flex-col justify-between overflow-hidden flex-shrink-0"
        style={{
          background: panelColor,
          clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)',
          padding: '3rem 4rem 3rem 3rem',
        }}
      >
        {/* Concentric circles background */}
        {[200, 400, 600, 800, 1000, 1200].map((size, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white pointer-events-none"
            style={{
              width: size,
              height: size,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.12,
            }}
          />
        ))}

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            style={{
              width: 40,
              height: 40,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            L
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            <span style={{ color: '#fff' }}>Learn</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>IQ</span>
          </span>
        </div>

        {/* Brand copy */}
        <div className="relative z-10">
          <h1
            style={{
              color: '#fff',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {title || <>PRECISION IN<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>ASSESSMENT.</span></>}
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              lineHeight: 1.8,
              marginTop: '1rem',
            }}
          >
            {description || <>LOGIN TO YOUR PROFESSIONAL<br />DASHBOARD AND<br />MANAGE YOUR TEST JOURNEY.</>}
          </p>
        </div>

        {/* Footer */}
        <div
          className="relative z-10"
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          LEARN<span style={{ color: '#fff' }}>IQ</span> © 2026
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ──────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col justify-center relative"
        style={{
          background: '#0d0d10',
          padding: 'clamp(1.5rem, 4vw, 5rem) clamp(1rem, 5vw, 6rem)',
        }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-10">
          <div
            style={{
              width: 36,
              height: 36,
              background: panelColor,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            L
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }}>
            <span style={{ color: '#fff' }}>Learn</span>
            <span style={{ color: panelColor }}>IQ</span>
          </span>
        </div>

        <div style={{ maxWidth: 500, width: '100%', position: 'relative', zIndex: 10 }}>
          {children}
        </div>

        {/* MOBILE DECORATIONS */}
        {showMobileDecorations && (
          <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
             {/* Slant Triangles */}
             <div 
                className="absolute top-0 right-0 w-40 h-40 opacity-20"
                style={{
                  background: `linear-gradient(225deg, ${accentColor}, transparent)`,
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
                }}
             />
             <div 
                className="absolute bottom-0 left-0 w-64 h-64 opacity-15"
                style={{
                  background: `linear-gradient(45deg, ${accentColor}, transparent)`,
                  clipPath: 'polygon(0 0, 0 100%, 100% 100%)'
                }}
             />

             {/* Concentric Rings (Lighter shade) */}
             {[200, 400, 600, 800].map((size, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-white pointer-events-none"
                  style={{
                    width: size,
                    height: size,
                    top: '20%',
                    right: '-10%',
                    transform: 'translate(50%, -50%)',
                    opacity: 0.05,
                  }}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
