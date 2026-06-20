'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Web Audio API Retro Arcade Synthesizer for Haidi Tsumo win (电光石火音效)
const playHaidiSound = () => {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  
  const ctx = new AudioCtx();
  const time = ctx.currentTime;
  
  // 1. Thunder Rumble (Triangle wave low-end)
  const oscLow = ctx.createOscillator();
  const gainLow = ctx.createGain();
  oscLow.type = 'triangle';
  oscLow.frequency.setValueAtTime(90, time);
  oscLow.frequency.exponentialRampToValueAtTime(30, time + 1.5);
  gainLow.gain.setValueAtTime(0.3, time);
  gainLow.gain.exponentialRampToValueAtTime(0.001, time + 1.5);
  oscLow.connect(gainLow);
  gainLow.connect(ctx.destination);
  oscLow.start(time);
  oscLow.stop(time + 1.5);
  
  // 2. High-Voltage Lightning Zaps (Rapid pitch-dropping Sawtooths)
  const playZap = (startTime, duration, startFreq, endFreq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };
  
  // Multiple rapid lightning strokes overlapping
  playZap(time, 0.25, 2200, 100);
  playZap(time + 0.1, 0.2, 1800, 80);
  playZap(time + 0.2, 0.3, 2500, 60);
  
  // 3. Crackling Sparks (White noise generator)
  const bufferSize = ctx.sampleRate * 1.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const playSpark = (sparkTime, sparkDuration, volume) => {
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500 + Math.random() * 1500, sparkTime);
    filter.Q.setValueAtTime(5, sparkTime);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, sparkTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sparkTime + sparkDuration);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseSource.start(sparkTime);
    noiseSource.stop(sparkTime + sparkDuration);
  };
  
  // Play a cluster of 15 rapid spark crackles during the first 0.6 seconds
  for (let i = 0; i < 15; i++) {
    const sparkOffset = i * 0.04 + Math.random() * 0.02;
    playSpark(time + sparkOffset, 0.03 + Math.random() * 0.04, 0.12);
  }
  
  // 4. Retro Victory Arpeggio Fanfare (Square waves, starting at 0.5s)
  const playNote = (noteTime, freq, noteDuration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, noteTime);
    gain.gain.setValueAtTime(0.06, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteTime);
    osc.stop(noteTime + noteDuration + 0.01);
  };
  
  const notes = [
    { freq: 523.25, dur: 0.15 }, // C5
    { freq: 659.25, dur: 0.15 }, // E5
    { freq: 783.99, dur: 0.15 }, // G5
    { freq: 1046.50, dur: 0.25 }, // C6
    { freq: 783.99, dur: 0.15 }, // G5
    { freq: 1046.50, dur: 0.4 }  // C6
  ];
  
  let currentOffset = 0.5; // Start notes at 0.5s
  for (let i = 0; i < notes.length; i++) {
    playNote(time + currentOffset, notes[i].freq, notes[i].dur);
    currentOffset += notes[i].dur + 0.03;
  }
  
  // 5. Final retro pitch-sliding chord (starts at 1.4s)
  const chordStart = time + currentOffset;
  const playChordNote = (freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, chordStart);
    osc.frequency.linearRampToValueAtTime(freq * 1.5, chordStart + 1.2);
    gain.gain.setValueAtTime(0.05, chordStart);
    gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(chordStart);
    osc.stop(chordStart + 1.3);
  };
  
  playChordNote(523.25); // C5
  playChordNote(659.25); // E5
  playChordNote(783.99); // G5
  playChordNote(1046.50); // C6
  
  // Top layer high peak beep
  const oscArp = ctx.createOscillator();
  const gainArp = ctx.createGain();
  oscArp.type = 'sine';
  oscArp.frequency.setValueAtTime(1567.98, chordStart); // G6
  gainArp.gain.setValueAtTime(0.04, chordStart);
  gainArp.gain.exponentialRampToValueAtTime(0.001, chordStart + 1.5);
  oscArp.connect(gainArp);
  gainArp.connect(ctx.destination);
  oscArp.start(chordStart);
  oscArp.stop(chordStart + 1.6);
};

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Dashboard tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing states
  const [editUser, setEditUser] = useState(null);
  const [editChipsInput, setEditChipsInput] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    default_start_chips: '10000',
    ai_pon_rate_easy: '0.1',
    ai_pon_rate_normal: '0.3',
    ai_pon_rate_hard: '0.5',
    ai_chi_rate_easy: '0.2',
    ai_chi_rate_normal: '0.5',
    ai_chi_rate_hard: '0.8',
    ai_randomness_easy: '0.4',
    ai_randomness_normal: '0.15',
    ai_randomness_hard: '0.0',
    tiankai_peek_type: 'limited',
    big_hand_rate: '0.0'
  });
  
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Load auth state and initial data
  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/check');
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
        loadAllData();
      }
    } catch (e) {
      console.error('Check auth error:', e);
    }
  };

  const loadAllData = () => {
    loadStats();
    loadUsers();
    loadSettings();
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error('Load stats error:', e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error('Load users error:', e);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setSettingsForm({ ...data.settings });
      }
    } catch (e) {
      console.error('Load settings error:', e);
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
        loadAllData();
      } else {
        setLoginError(data.error || '驗證失敗');
      }
    } catch (err) {
      setLoginError('無法連接到伺服器');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      setAuthenticated(false);
      setPassword('');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleEditUserClick = (user) => {
    setEditUser(user);
    setEditChipsInput(user.chips.toString());
    setUsersSuccess('');
  };

  const handleUpdateChips = async (e) => {
    if (e) e.preventDefault();
    if (!editUser) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editUser.id,
          chips: parseInt(editChipsInput, 10)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditUser(null);
        setUsersSuccess(`成功更新 ${editUser.id} 的籌碼數量為 ${editChipsInput}`);
        loadUsers();
        loadStats(); // Update circulation pool statistics
      }
    } catch (err) {
      console.error('Update chips error:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm(`確定要永久刪除用戶 "${userId}" 及其所有對局記錄嗎？`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsersSuccess(`用戶 ${userId} 已成功刪除`);
        loadUsers();
        loadStats();
      }
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  const handleSettingInputChange = (key, val) => {
    setSettingsForm(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSettingsSubmit = async (e) => {
    if (e) e.preventDefault();
    setSettingsSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsForm })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setSettingsSuccess('遊戲設置已成功保存並套用！');
        setTimeout(() => setSettingsSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('兩次輸入的新密碼不一致！');
      return;
    }

    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess('管理員密碼已成功更新！');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 5000);
      } else {
        setPasswordError(data.error || '密碼更新失敗，請檢查輸入。');
      }
    } catch (err) {
      setPasswordError('網路連線失敗或伺服器出錯。');
    }
  };

  if (!mounted) return null;

  // --- Render Login Panel ---
  if (!authenticated) {
    return (
      <div className="adminLoginBg">
        <div className="adminLoginBox">
          <div className="adminTitleMain">大滿貫</div>
          <div className="adminTitleSub">管理員控制台 / ADMIN PORTAL</div>
          <div className="adminDecoLine"></div>
          
          <form onSubmit={handleLoginSubmit} className="adminLoginForm">
            <input 
              type="password" 
              className="adminPasswordInput"
              placeholder="請輸入管理員解鎖密碼..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
              <button type="submit" className="adminUnlockBtn">解鎖控制台</button>
              <Link href="/" className="adminBackGameBtn">返回遊戲</Link>
            </div>
          </form>
          {loginError && <div className="adminLoginError">{loginError}</div>}
        </div>
      </div>
    );
  }

  // Filter users based on search query
  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render Main Admin Control Dashboard ---
  return (
    <div className="adminDashboardLayout">
      {/* Top Header Bar */}
      <header className="adminHeaderBar">
        <div className="adminHeaderBrand">
          <span className="brandMain">大滿貫</span>
          <span className="brandSub">街機麻將 90s 控制台</span>
        </div>
        <div className="adminHeaderActions">
          <button className="adminHeaderBtn adminLogoutBtn" onClick={handleLogout}>退出登入</button>
          <Link href="/" className="adminHeaderBtn adminBackBtn">返回遊戲</Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="adminMainContainer">
        {/* Navigation Sidebar */}
        <aside className="adminSidebar">
          <button 
            className={`adminSidebarItem ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); loadStats(); }}
          >
            📊 數據概覽
          </button>
          <button 
            className={`adminSidebarItem ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); loadUsers(); }}
          >
            👥 用戶管理
          </button>
          <button 
            className={`adminSidebarItem ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); loadSettings(); }}
          >
            ⚙️ 遊戲設置
          </button>
          <button 
            className={`adminSidebarItem ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => { setActiveTab('password'); setPasswordError(''); setPasswordSuccess(''); }}
          >
            🔑 修改密碼
          </button>
        </aside>

        {/* Dashboard Content Board */}
        <main className="adminContentBoard">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="adminTabContent">
              <h2 className="adminTabHeading">📊 數據分析與概覽</h2>
              
              {stats ? (
                <>
                  {/* Stats Grid Cards */}
                  <div className="adminStatsGrid">
                    <div className="adminStatCard cardUsers">
                      <div className="cardLabel">已註冊玩家數</div>
                      <div className="cardVal">{stats.totalUsers}</div>
                    </div>
                    <div className="adminStatCard cardGames">
                      <div className="cardLabel">累計對局局數</div>
                      <div className="cardVal">{stats.totalGames}</div>
                    </div>
                    <div className="adminStatCard cardChips">
                      <div className="cardLabel">流通籌碼總量</div>
                      <div className="cardVal">{stats.totalChips.toLocaleString()}</div>
                    </div>
                    <div className="adminStatCard cardOutcomes">
                      <div className="cardLabel">玩家輸贏統計</div>
                      <div className="cardSubVal">
                        <span className="subWin">贏: {stats.winCount}</span>
                        <span className="subDraw">流局: {stats.drawCount}</span>
                        <span className="subLoss">輸: {stats.lossCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Records Table */}
                  <h3 className="adminSubSectionHeading">📋 最近 20 局對局記錄</h3>
                  <div className="adminTableWrapper">
                    <table className="adminTable">
                      <thead>
                        <tr>
                          <th>對局 ID</th>
                          <th>玩家</th>
                          <th>對局局數</th>
                          <th>結果</th>
                          <th>籌碼變動</th>
                          <th>胡牌細節 (Yaku)</th>
                          <th>時間</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentRecords.length > 0 ? (
                          stats.recentRecords.map((rec) => (
                            <tr key={rec.id}>
                              <td>#{rec.id}</td>
                              <td className="userNameCol">{rec.user_id}</td>
                              <td>第 {rec.round} 局</td>
                              <td>
                                <span className={`outcomeBadge outcome-${rec.outcome}`}>
                                  {rec.outcome === 'win' ? '玩家胡牌' : rec.outcome === 'loss' ? '電腦胡牌' : '流局'}
                                </span>
                              </td>
                              <td className={`scoreChangeCol ${rec.score_change > 0 ? 'pos' : rec.score_change < 0 ? 'neg' : 'zero'}`}>
                                {rec.score_change > 0 ? `+${rec.score_change}` : rec.score_change}
                              </td>
                              <td className="yakuDetailsCol">
                                {rec.outcome === 'win' && rec.yaku_details
                                  ? `${rec.yaku_details.yaku.join(' · ')} (${rec.yaku_details.han}番)`
                                  : '-'}
                              </td>
                              <td className="dateCol">{new Date(rec.played_at).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="emptyRow">暫無對局歷史記錄</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="adminLoading">正在加載統計數據...</div>
              )}
            </div>
          )}

          {/* TAB 2: USER MANAGER */}
          {activeTab === 'users' && (
            <div className="adminTabContent">
              <h2 className="adminTabHeading">👥 註冊用戶管理</h2>
              {usersSuccess && <div className="adminAlertSuccess">{usersSuccess}</div>}

              {/* Search Box */}
              <div className="adminSearchRow">
                <input 
                  type="text" 
                  className="adminSearchInput"
                  placeholder="輸入用戶名搜索玩家..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Users Table */}
              <div className="adminTableWrapper">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th>用戶名</th>
                      <th>創立時間</th>
                      <th>當前籌碼量</th>
                      <th>最後活躍時間</th>
                      <th>總對局局數</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="userNameCell">{user.id}</td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="userChipsCell">{user.chips.toLocaleString()}</td>
                          <td>{new Date(user.last_active).toLocaleString()}</td>
                          <td>{user.games_played} 局 (贏: {user.wins})</td>
                          <td className="userActionsCell">
                            <button className="userActBtn editChipsBtn" onClick={() => handleEditUserClick(user)}>編輯籌碼</button>
                            <button className="userActBtn deleteUserBtn" onClick={() => handleDeleteUser(user.id)}>刪除玩家</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="emptyRow">未找到匹配的註冊用戶</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Edit Chips Modal */}
              {editUser && (
                <div className="adminModalOverlay">
                  <div className="adminModalBox">
                    <h3 className="adminModalTitle">編輯用戶籌碼</h3>
                    <div className="adminModalSub">用戶名: <span className="highlightName">{editUser.id}</span></div>
                    
                    <form onSubmit={handleUpdateChips} className="adminModalForm">
                      <div className="formGroup">
                        <label>當前籌碼量:</label>
                        <input 
                          type="number"
                          className="adminModalInput"
                          value={editChipsInput}
                          onChange={(e) => setEditChipsInput(e.target.value)}
                          required
                          min="0"
                        />
                      </div>
                      <div className="modalActions">
                        <button type="submit" className="modalSubmitBtn">確認修改</button>
                        <button type="button" className="modalCancelBtn" onClick={() => setEditUser(null)}>取消</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GAME SETTINGS */}
          {activeTab === 'settings' && (
            <div className="adminTabContent">
              <h2 className="adminTabHeading">⚙️ 遊戲規則與數值設置</h2>
              
              <form onSubmit={handleSettingsSubmit} className="adminSettingsForm">
                {settingsSuccess && <div className="adminAlertSuccess">{settingsSuccess}</div>}
                
                {/* Global Settings */}
                <div className="settingsSection">
                  <h3 className="settingsSectionHeading">1. 註冊初始帳戶</h3>
                  <div className="settingsGrid">
                    <div className="settingsField">
                      <label className="settingsLabel">
                        註冊初始贈送籌碼
                        <span className="fieldHelp">新用戶註冊時贈送的初始籌碼總量</span>
                      </label>
                      <input 
                        type="number"
                        className="settingsInput"
                        value={settingsForm.default_start_chips || '10000'}
                        onChange={(e) => handleSettingInputChange('default_start_chips', e.target.value)}
                        required
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="settingsSection">
                  <h3 className="settingsSectionHeading">1.5 天開眼與作弊配牌設定</h3>
                  <div className="settingsGrid">
                    <div className="settingsField">
                      <label className="settingsLabel">
                        天開眼透視模式
                        <span className="fieldHelp">選擇遊戲在天開眼模式下是隨機時刻開啟對手手牌，還是僅在開局限時展示</span>
                      </label>
                      <select 
                        className="settingsInput"
                        value={settingsForm.tiankai_peek_type || 'limited'}
                        onChange={(e) => handleSettingInputChange('tiankai_peek_type', e.target.value)}
                        style={{ height: '40px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0 10px' }}
                      >
                        <option value="global">全局透視 (對局中隨機時刻開啟)</option>
                        <option value="limited">限時窺屏 (開局前 5 秒限時展示)</option>
                      </select>
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">
                        作弊配牌大牌概率 (0.0 ~ 1.0)
                        <span className="fieldHelp">起手發牌時獲得大三元、大四喜、國士無雙等大牌的機率 (0.0=正常發牌, 1.0=100%獲得大牌)</span>
                      </label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.big_hand_rate || '0.0'}
                        onChange={(e) => handleSettingInputChange('big_hand_rate', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* AI Difficulty Easy Settings */}
                <div className="settingsSection">
                  <h3 className="settingsSectionHeading">2. 電腦 AI 難度參數 - 簡單 (EASY)</h3>
                  <div className="settingsGrid">
                    <div className="settingsField">
                      <label className="settingsLabel">吃牌觸發概率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_chi_rate_easy || '0.2'}
                        onChange={(e) => handleSettingInputChange('ai_chi_rate_easy', e.target.value)}
                        required
                      />
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">碰牌/槓牌觸發概率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_pon_rate_easy || '0.1'}
                        onChange={(e) => handleSettingInputChange('ai_pon_rate_easy', e.target.value)}
                        required
                      />
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">隨機出牌盲目率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_randomness_easy || '0.4'}
                        onChange={(e) => handleSettingInputChange('ai_randomness_easy', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* AI Difficulty Normal Settings */}
                <div className="settingsSection">
                  <h3 className="settingsSectionHeading">3. 電腦 AI 難度參數 - 普通 (NORMAL)</h3>
                  <div className="settingsGrid">
                    <div className="settingsField">
                      <label className="settingsLabel">吃牌觸發概率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_chi_rate_normal || '0.5'}
                        onChange={(e) => handleSettingInputChange('ai_chi_rate_normal', e.target.value)}
                        required
                      />
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">碰牌/槓牌觸發概率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_pon_rate_normal || '0.3'}
                        onChange={(e) => handleSettingInputChange('ai_pon_rate_normal', e.target.value)}
                        required
                      />
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">隨機出牌盲目率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_randomness_normal || '0.15'}
                        onChange={(e) => handleSettingInputChange('ai_randomness_normal', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* AI Difficulty Hard Settings */}
                <div className="settingsSection">
                  <h3 className="settingsSectionHeading">4. 電腦 AI 難度參數 - 困難 (HARD)</h3>
                  <div className="settingsGrid">
                    <div className="settingsField">
                      <label className="settingsLabel">吃牌觸發概率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_chi_rate_hard || '0.8'}
                        onChange={(e) => handleSettingInputChange('ai_chi_rate_hard', e.target.value)}
                        required
                      />
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">碰牌/槓牌觸發概率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_pon_rate_hard || '0.5'}
                        onChange={(e) => handleSettingInputChange('ai_pon_rate_hard', e.target.value)}
                        required
                      />
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">隨機出牌盲目率 (0.0 ~ 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="1"
                        className="settingsInput"
                        value={settingsForm.ai_randomness_hard || '0.0'}
                        onChange={(e) => handleSettingInputChange('ai_randomness_hard', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="settingsActionRow">
                  <button type="submit" className="saveSettingsBtn">保存遊戲設置</button>
                </div>
              </form>

              {/* Sound Effect Test Section */}
              <div className="settingsSection" style={{ marginTop: '30px' }}>
                <h3 className="settingsSectionHeading">5. 遊戲特效與音效測試</h3>
                <div style={{ padding: '15px 0' }}>
                  <button 
                    type="button" 
                    className="saveSettingsBtn"
                    style={{ background: 'linear-gradient(180deg, #ff2d75, #b01040)', borderColor: '#ff7da4', boxShadow: '0 0 10px rgba(255,45,117,0.4)', textShadow: '0 0 5px rgba(255,255,255,0.5)' }}
                    onClick={playHaidiSound}
                  >
                    🌌 演示海底撈月效果 (音效)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PASSWORD */}
          {activeTab === 'password' && (
            <div className="adminTabContent">
              <h2 className="adminTabHeading">🔑 修改管理員密碼</h2>
              <form onSubmit={handlePasswordSubmit} className="adminSettingsForm" style={{ maxWidth: '500px' }}>
                <div className="settingsSection">
                  <h3 className="settingsSectionHeading">安全驗證</h3>
                  <div className="settingsGrid" style={{ gridTemplateColumns: '1fr', gap: '15px' }}>
                    <div className="settingsField">
                      <label className="settingsLabel">當前密碼 / CURRENT PASSWORD</label>
                      <input 
                        type="password"
                        className="settingsInput"
                        placeholder="請輸入當前使用的管理員密碼..."
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">新密碼 / NEW PASSWORD</label>
                      <input 
                        type="password"
                        className="settingsInput"
                        placeholder="請輸入新的管理員密碼..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={4}
                      />
                    </div>
                    <div className="settingsField">
                      <label className="settingsLabel">確認新密碼 / CONFIRM NEW PASSWORD</label>
                      <input 
                        type="password"
                        className="settingsInput"
                        placeholder="請再次輸入新密碼以進行確認..."
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="settingsActionRow" style={{ marginTop: '20px' }}>
                  <button type="submit" className="saveSettingsBtn">更新密碼</button>
                </div>
              </form>

              {passwordSuccess && <div className="settingsSuccessMsg" style={{ marginTop: '15px' }}>{passwordSuccess}</div>}
              {passwordError && <div className="adminLoginError" style={{ marginTop: '15px', color: '#ff4d4d' }}>{passwordError}</div>}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
