'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
    ai_randomness_hard: '0.0'
  });
  
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');

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
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
