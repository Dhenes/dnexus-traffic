import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  Percent,
  Settings,
  Layers,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Database,
  ArrowUpRight,
  LogOut,
  Users,
  Plus,
  Shield,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Custom Logos
const MetaLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: '#1877F2' }}>
    <path d="M16.5 6C15.2 6 14.1 6.8 13.5 8c-.6-1.2-1.7-2-3-2C8.3 6 6.5 7.8 6.5 10c0 3 4.5 7.5 5.5 8.5 1-1 5.5-5.5 5.5-8.5 0-2.2-1.8-4-4-4zm-6 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: '#EA4335' }}>
    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.866 1 .696 6.168.696 12.5S5.866 24 12.24 24c6.65 0 11.084-4.67 11.084-11.24 0-.756-.08-1.334-.175-1.926H12.24z"/>
  </svg>
);

const TikTokLogo = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ color: '#FE2C55' }}>
    <path d="M12.525.02c1.31.02 2.61.1 3.86.31v4.27c-.77-.18-1.56-.27-2.36-.27-.85 0-1.68.1-2.48.3v13.55c0 3.27-2.66 5.92-5.93 5.92-3.28 0-5.93-2.65-5.93-5.92 0-3.1 2.37-5.65 5.4-5.9v4.29c-.75.12-1.31.78-1.31 1.61 0 .9.73 1.63 1.63 1.63.85 0 1.54-.65 1.62-1.48V.02h3.51zm8.39 6.2c.45.05.89.15 1.32.3v3.94c-.42-.16-.86-.27-1.32-.34-2-.27-3.6-1.52-4.42-3.15v2.85c0-2-1.63-3.63-3.63-3.63H9.36c.86 1.48 2.44 2.47 4.23 2.5 1.83.03 3.48-.96 4.31-2.47.82 1.5 2.42 2.5 4.23 2.53.26 0 .52-.01.78-.03V6.22z"/>
  </svg>
);

// Types
interface MetaMetric {
  id: string;
  date: string;
  campaign_id: string;
  campaign_name: string;
  reach: number;
  impressions: number;
  clicks: number;
  spend: number;
  conversions_actions: number;
}

interface GoogleMetric {
  id: string;
  date: string;
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversions_value: number;
}

interface TikTokMetric {
  id: string;
  date: string;
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversion: number;
  real_time_conversion: number;
}

interface Credentials {
  meta: { appId: string; appSecret: string; accessToken: string; accountId: string };
  google: { devToken: string; clientId: string; clientSecret: string; refreshToken: string; customerId: string };
  tiktok: { appId: string; secret: string; accessToken: string; advertiserId: string };
}

interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'client';
  clientId: string;
  clientName: string;
  clients?: Client[];
}

interface Client {
  id: string;
  name: string;
  created_at: number;
}

interface UserListItem {
  id: string;
  email: string;
  role: string;
  client_id: string;
  client_name?: string;
  clientIds?: string[];
  clientNames?: string[];
  created_at: number;
}

// Generate realistic mock data for local fallback/sandbox per client
const generateMockData = (clientId: string) => {
  const meta: MetaMetric[] = [];
  const google: GoogleMetric[] = [];
  const tiktok: TikTokMetric[] = [];

  const clientSuffix = clientId === 'c_alfa' ? 'Alfa' : 'Beta';
  const scale = clientId === 'c_alfa' ? 1.6 : 0.8;

  const campaignsMeta = [
    { id: 'm_c1', name: `Meta_Conversão_Ebook_${clientSuffix}` },
    { id: 'm_c2', name: `Meta_Lookalike_Compradores_${clientSuffix}` },
    { id: 'm_c3', name: `Meta_Remarketing_Carrinho_${clientSuffix}` }
  ];

  const campaignsGoogle = [
    { id: 'g_c1', name: `Google_Pesquisa_Marca_${clientSuffix}` },
    { id: 'g_c2', name: `Google_PMax_Produtos_${clientSuffix}` },
    { id: 'g_c3', name: `Google_Display_${clientSuffix}` }
  ];

  const campaignsTiktok = [
    { id: 't_c1', name: `TikTok_Desafio30d_${clientSuffix}` },
    { id: 't_c2', name: `TikTok_Influenciadores_${clientSuffix}` }
  ];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    campaignsMeta.forEach((c) => {
      const rand = (Math.sin(i * 0.5) * 0.2 + 1) * scale;
      const reach = Math.round((5000 + Math.random() * 2000) * rand);
      const impressions = Math.round(reach * (1.1 + Math.random() * 0.2));
      const clicks = Math.round(impressions * (0.015 + Math.random() * 0.01));
      const spend = parseFloat(((150 + Math.random() * 80) * rand).toFixed(2));
      const conversions_actions = Math.round(clicks * (0.05 + Math.random() * 0.04));
      meta.push({
        id: `${clientId}_meta_${c.id}_${dateStr}`,
        date: dateStr,
        campaign_id: c.id,
        campaign_name: c.name,
        reach,
        impressions,
        clicks,
        spend,
        conversions_actions
      });
    });

    campaignsGoogle.forEach((c) => {
      const rand = (Math.cos(i * 0.4) * 0.25 + 1) * scale;
      const impressions = Math.round((8000 + Math.random() * 3000) * rand);
      const clicks = Math.round(impressions * (0.03 + Math.random() * 0.02));
      const cost = parseFloat(((200 + Math.random() * 120) * rand).toFixed(2));
      const conversions = parseFloat((clicks * (0.04 + Math.random() * 0.03)).toFixed(1));
      const conversions_value = parseFloat((conversions * (85 + Math.random() * 30)).toFixed(2));
      google.push({
        id: `${clientId}_google_${c.id}_${dateStr}`,
        date: dateStr,
        campaign_id: c.id,
        campaign_name: c.name,
        impressions,
        clicks,
        cost,
        conversions,
        conversions_value
      });
    });

    campaignsTiktok.forEach((c) => {
      const rand = (Math.sin(i * 0.6) * 0.3 + 1) * scale;
      const impressions = Math.round((12000 + Math.random() * 5000) * rand);
      const clicks = Math.round(impressions * (0.008 + Math.random() * 0.006));
      const spend = parseFloat(((100 + Math.random() * 50) * rand).toFixed(2));
      const conversion = Math.round(clicks * (0.03 + Math.random() * 0.03));
      const real_time_conversion = Math.round(conversion * (0.9 + Math.random() * 0.15));
      tiktok.push({
        id: `${clientId}_tiktok_${c.id}_${dateStr}`,
        date: dateStr,
        campaign_id: c.id,
        campaign_name: c.name,
        impressions,
        clicks,
        spend,
        conversion,
        real_time_conversion
      });
    });
  }

  return { meta, google, tiktok };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'meta' | 'google' | 'tiktok' | 'settings' | 'clients'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'this_month'>('30d');
  
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('dnexus_token'));
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Client selection for Admin
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Admin client management states
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'client'>('client');
  const [newUserClientId, setNewUserClientId] = useState('');
  const [newUserClientIds, setNewUserClientIds] = useState<string[]>([]);

  // Editing states
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingClientName, setEditingClientName] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserEmail, setEditingUserEmail] = useState<string>('');
  const [editingUserRole, setEditingUserRole] = useState<'admin' | 'client'>('client');
  const [editingUserClientId, setEditingUserClientId] = useState<string>('');
  const [editingUserClientIds, setEditingUserClientIds] = useState<string[]>([]);
  const [editingUserPassword, setEditingUserPassword] = useState<string>('');

  const [isSandbox, setIsSandbox] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Raw DB data state
  const [dbData, setDbData] = useState<{
    meta: MetaMetric[];
    google: GoogleMetric[];
    tiktok: TikTokMetric[];
  }>({ meta: [], google: [], tiktok: [] });

  // Credentials form state
  const [creds, setCreds] = useState<Credentials>({
    meta: { appId: '', appSecret: '', accessToken: '', accountId: '' },
    google: { devToken: '', clientId: '', clientSecret: '', refreshToken: '', customerId: '' },
    tiktok: { appId: '', secret: '', accessToken: '', advertiserId: '' }
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper fetch function that automatically sets authorization headers
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  // Check backend server and session on mount
  useEffect(() => {
    const checkServerAndSession = async () => {
      try {
        setLoading(true);
        if (token) {
          const meRes = await authenticatedFetch('/api/auth/me');
          if (meRes.ok) {
            const data = await meRes.json();
            setCurrentUser(data.user);
            if (data.user.role === 'client') {
              setSelectedClientId(data.user.clientId || (data.user.clients && data.user.clients[0]?.id) || '');
            }
            setIsSandbox(false);
            showToast(`Sessão restaurada para: ${data.user.email}`, 'success');
          } else {
            // Token invalid or expired
            localStorage.removeItem('dnexus_token');
            setToken(null);
          }
        } else {
          // Verify backend is reachable
          const testRes = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({}) });
          // If we get an authentication check response instead of connection failure, we are in D1 mode
          if (testRes.status === 400 || testRes.status === 401) {
            setIsSandbox(false);
          }
        }
      } catch {
        setIsSandbox(true);
      } finally {
        setLoading(false);
      }
    };

    checkServerAndSession();
  }, [token]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('E-mail e senha são obrigatórios', 'error');
      return;
    }

    setLoading(true);
    if (isSandbox) {
      // Mock Sandbox Login
      setTimeout(() => {
        let mockUser: AuthUser;
        if (loginEmail.includes('admin')) {
          mockUser = {
            id: 'u_admin',
            email: loginEmail,
            role: 'admin',
            clientId: '',
            clientName: ''
          };
          // Set up mock clients
          setClients([
            { id: 'c_alfa', name: 'Cliente Alfa (Varejo)', created_at: Date.now() },
            { id: 'c_beta', name: 'Cliente Beta (SaaS)', created_at: Date.now() }
          ]);
          setSelectedClientId('c_alfa');
        } else {
          mockUser = {
            id: 'u_client',
            email: loginEmail,
            role: 'client',
            clientId: 'c_alfa',
            clientName: 'Cliente Alfa (Varejo)',
            clients: [
              { id: 'c_alfa', name: 'Cliente Alfa (Varejo)', created_at: Date.now() },
              { id: 'c_beta', name: 'Cliente Beta (SaaS)', created_at: Date.now() }
            ]
          };
          setSelectedClientId('c_alfa');
        }

        setCurrentUser(mockUser);
        setToken('sandbox_token_jwt');
        localStorage.setItem('dnexus_token', 'sandbox_token_jwt');
        setLoading(false);
        showToast('Login efetuado no Sandbox!', 'success');
      }, 800);
    } else {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: loginPassword })
        });

        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
          localStorage.setItem('dnexus_token', data.token);
          setCurrentUser(data.user);
          if (data.user.role === 'client') {
            setSelectedClientId(data.user.clientId || (data.user.clients && data.user.clients[0]?.id) || '');
          }
          showToast('Login efetuado com sucesso!', 'success');
        } else {
          const data = await res.json();
          showToast(data.error || 'Falha no login', 'error');
        }
      } catch {
        showToast('Erro de conexão com o servidor', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dnexus_token');
    setToken(null);
    setCurrentUser(null);
    setDbData({ meta: [], google: [], tiktok: [] });
    setClients([]);
    setSelectedClientId('');
    showToast('Sessão encerrada', 'info');
  };

  // Load clients if Admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const loadClients = async () => {
      if (isSandbox) {
        setClients([
          { id: 'c_alfa', name: 'Cliente Alfa (Varejo)', created_at: Date.now() },
          { id: 'c_beta', name: 'Cliente Beta (SaaS)', created_at: Date.now() }
        ]);
        if (!selectedClientId) setSelectedClientId('c_alfa');
      } else {
        try {
          const res = await authenticatedFetch('/api/clients');
          if (res.ok) {
            const data = await res.json();
            setClients(data);
            if (data.length > 0 && !selectedClientId) {
              setSelectedClientId(data[0].id);
            }
          }
        } catch (err) {
          console.error('Erro ao buscar clientes', err);
        }
      }
    };

    loadClients();
  }, [currentUser, isSandbox]);

  // Load metrics and credentials based on selectedClientId or client context
  const loadData = async () => {
    if (!currentUser) return;

    const targetId = selectedClientId || currentUser.clientId;
    if (!targetId) {
      setDbData({ meta: [], google: [], tiktok: [] });
      return;
    }

    setLoading(true);
    if (isSandbox) {
      setTimeout(() => {
        setDbData(generateMockData(targetId));
        // Mock load credentials
        const savedCreds = localStorage.getItem(`dnexus_creds_${targetId}`);
        if (savedCreds) {
          setCreds(JSON.parse(savedCreds));
        } else {
          setCreds({
            meta: { appId: '', appSecret: '', accessToken: '', accountId: '' },
            google: { devToken: '', clientId: '', clientSecret: '', refreshToken: '', customerId: '' },
            tiktok: { appId: '', secret: '', accessToken: '', advertiserId: '' }
          });
        }
        setLoading(false);
      }, 500);
    } else {
      try {
        // Load metrics
        const metRes = await authenticatedFetch(`/api/metrics?range=${dateRange}&clientId=${targetId}`);
        if (metRes.ok) {
          const data = await metRes.json();
          setDbData(data);
        }
        
        // Load credentials
        const credRes = await authenticatedFetch(`/api/credentials?clientId=${targetId}`);
        if (credRes.ok) {
          const data = await credRes.json();
          setCreds(data);
        }
      } catch (err) {
        showToast('Erro ao carregar dados do banco D1', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, selectedClientId, dateRange, isSandbox]);

  // Sync metrics
  const handleSync = async () => {
    if (!currentUser) return;
    const targetId = selectedClientId || currentUser.clientId;
    
    if (!targetId) {
      showToast('Selecione um cliente para sincronizar', 'error');
      return;
    }

    setSyncing(true);
    showToast('Buscando métricas nas APIs...', 'info');

    if (isSandbox) {
      setTimeout(() => {
        setDbData(generateMockData(targetId));
        setSyncing(false);
        showToast('Dados sincronizados no Sandbox!', 'success');
      }, 1500);
    } else {
      try {
        const res = await authenticatedFetch(`/api/sync?clientId=${targetId}`, { method: 'POST' });
        if (res.ok) {
          const result = await res.json();
          showToast(result.summary, 'success');
          loadData();
        } else {
          const result = await res.json();
          showToast(result.error || 'Erro ao sincronizar', 'error');
        }
      } catch {
        showToast('Erro de conexão ao sincronizar', 'error');
      } finally {
        setSyncing(false);
      }
    }
  };

  // Save Credentials (Admin only)
  const handleSaveCredentials = async (platform: keyof Credentials) => {
    if (!selectedClientId) {
      showToast('Selecione um cliente antes', 'error');
      return;
    }

    showToast(`Salvando chaves de ${platform.toUpperCase()}...`, 'info');
    if (isSandbox) {
      localStorage.setItem(`dnexus_creds_${selectedClientId}`, JSON.stringify(creds));
      setTimeout(() => {
        showToast(`Credenciais de ${platform.toUpperCase()} salvas localmente!`, 'success');
      }, 500);
    } else {
      try {
        const res = await authenticatedFetch('/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, data: creds[platform], clientId: selectedClientId })
        });
        if (res.ok) {
          showToast(`Credenciais de ${platform.toUpperCase()} salvas no D1!`, 'success');
        } else {
          const data = await res.json();
          showToast(data.error || 'Erro ao salvar', 'error');
        }
      } catch {
        showToast('Erro ao conectar na API', 'error');
      }
    }
  };

  // Admin view - Load users and clients for management tab
  const loadAdminManagementData = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (isSandbox) {
      setUsersList([
        { id: 'u_admin', email: 'admin@dnexus.com', role: 'admin', client_id: '', created_at: Date.now() },
        { id: 'u_alfa', email: 'alfa@dnexus.com', role: 'client', client_id: 'c_alfa', client_name: 'Cliente Alfa (Varejo)', created_at: Date.now() },
        { id: 'u_beta', email: 'beta@dnexus.com', role: 'client', client_id: 'c_beta', client_name: 'Cliente Beta (SaaS)', created_at: Date.now() }
      ]);
      return;
    }
    try {
      const res = await authenticatedFetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'clients') {
      loadAdminManagementData();
    }
  }, [activeTab]);

  // Admin - Create client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    if (isSandbox) {
      const newId = 'c_' + Math.random().toString(36).substring(2, 6);
      const newC = { id: newId, name: newClientName, created_at: Date.now() };
      setClients([...clients, newC]);
      setNewClientName('');
      showToast('Cliente criado no Sandbox!', 'success');
    } else {
      try {
        const res = await authenticatedFetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newClientName })
        });
        if (res.ok) {
          const data = await res.json();
          setClients([...clients, data.client]);
          setNewClientName('');
          showToast('Empresa criada com sucesso!', 'success');
        } else {
          const data = await res.json();
          showToast(data.error || 'Erro ao criar', 'error');
        }
      } catch {
        showToast('Erro ao conectar', 'error');
      }
    }
  };

  // Admin - Create User login
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      showToast('Preencha e-mail e senha do usuário', 'error');
      return;
    }

    if (newUserRole === 'client' && newUserClientIds.length === 0) {
      showToast('Selecione pelo menos uma empresa para o cliente', 'error');
      return;
    }

    if (isSandbox) {
      const firstId = newUserClientIds[0] || '';
      const firstClientName = clients.find(c => c.id === firstId)?.name || '';
      const clientNames = newUserClientIds.map(id => clients.find(c => c.id === id)?.name || '');
      const newU: UserListItem = {
        id: 'u_' + Math.random().toString(36).substring(2, 6),
        email: newUserEmail,
        role: newUserRole,
        client_id: newUserRole === 'admin' ? '' : firstId,
        client_name: newUserRole === 'admin' ? '' : firstClientName,
        clientIds: newUserRole === 'admin' ? [] : newUserClientIds,
        clientNames: newUserRole === 'admin' ? [] : clientNames,
        created_at: Date.now()
      };
      setUsersList([newU, ...usersList]);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserClientIds([]);
      showToast('Usuário criado no Sandbox!', 'success');
    } else {
      try {
        const res = await authenticatedFetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newUserEmail,
            password: newUserPassword,
            role: newUserRole,
            clientIds: newUserClientIds,
            clientId: newUserClientIds[0] || ''
          })
        });
        if (res.ok) {
          const data = await res.json();
          const clientNames = newUserClientIds.map(id => clients.find(c => c.id === id)?.name || '');
          setUsersList([{
            ...data.user,
            client_name: clientNames[0] || '',
            clientIds: newUserClientIds,
            clientNames: clientNames
          }, ...usersList]);
          setNewUserEmail('');
          setNewUserPassword('');
          setNewUserClientIds([]);
          showToast('Usuário criado com sucesso!', 'success');
        } else {
          const data = await res.json();
          showToast(data.error || 'Erro ao criar usuário', 'error');
        }
      } catch {
        showToast('Erro ao conectar', 'error');
      }
    }
  };

  // Admin - Delete client
  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta empresa? Isso apagará permanentemente todos os usuários, credenciais e métricas associadas.')) {
      return;
    }

    if (isSandbox) {
      setClients(clients.filter(c => c.id !== clientId));
      setUsersList(usersList.filter(u => u.client_id !== clientId));
      showToast('Empresa excluída no Sandbox!', 'success');
      if (selectedClientId === clientId) {
        setSelectedClientId('');
      }
    } else {
      try {
        setLoading(true);
        const res = await authenticatedFetch(`/api/clients?id=${clientId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setClients(clients.filter(c => c.id !== clientId));
          setUsersList(usersList.filter(u => u.client_id !== clientId));
          showToast('Empresa excluída com sucesso!', 'success');
          if (selectedClientId === clientId) {
            setSelectedClientId('');
          }
        } else {
          const data = await res.json();
          showToast(data.error || 'Erro ao excluir empresa', 'error');
        }
      } catch {
        showToast('Erro de conexão ao excluir', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Admin - Update client
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientName.trim() || !editingClientId) return;

    if (isSandbox) {
      setClients(clients.map(c => c.id === editingClientId ? { ...c, name: editingClientName.trim() } : c));
      setUsersList(usersList.map(u => u.client_id === editingClientId ? { ...u, client_name: editingClientName.trim() } : u));
      setEditingClientId(null);
      setEditingClientName('');
      showToast('Empresa atualizada no Sandbox!', 'success');
    } else {
      try {
        setLoading(true);
        const res = await authenticatedFetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingClientId, name: editingClientName.trim() })
        });
        if (res.ok) {
          setClients(clients.map(c => c.id === editingClientId ? { ...c, name: editingClientName.trim() } : c));
          setUsersList(usersList.map(u => u.client_id === editingClientId ? { ...u, client_name: editingClientName.trim() } : u));
          setEditingClientId(null);
          setEditingClientName('');
          showToast('Empresa atualizada com sucesso!', 'success');
        } else {
          const data = await res.json();
          showToast(data.error || 'Erro ao atualizar empresa', 'error');
        }
      } catch {
        showToast('Erro de conexão ao atualizar', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Admin - Delete user
  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      showToast('Você não pode excluir o seu próprio usuário', 'error');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir esta conta de usuário?')) {
      return;
    }

    if (isSandbox) {
      setUsersList(usersList.filter(u => u.id !== userId));
      showToast('Usuário excluído no Sandbox!', 'success');
    } else {
      try {
        setLoading(true);
        const res = await authenticatedFetch(`/api/users?id=${userId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setUsersList(usersList.filter(u => u.id !== userId));
          showToast('Usuário excluído com sucesso!', 'success');
        } else {
          const data = await res.json();
          showToast(data.error || 'Erro ao excluir usuário', 'error');
        }
      } catch {
        showToast('Erro de conexão ao excluir', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Admin - Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editingUserEmail) {
      showToast('E-mail é obrigatório', 'error');
      return;
    }

    if (editingUserRole === 'client' && editingUserClientIds.length === 0) {
      showToast('Selecione pelo menos uma empresa para o cliente', 'error');
      return;
    }

    if (isSandbox) {
      const firstId = editingUserClientIds[0] || '';
      const clientName = clients.find(c => c.id === firstId)?.name || '';
      const clientNames = editingUserClientIds.map(id => clients.find(c => c.id === id)?.name || '');
      setUsersList(usersList.map(u => u.id === editingUserId ? {
        ...u,
        email: editingUserEmail,
        role: editingUserRole,
        client_id: editingUserRole === 'admin' ? '' : firstId,
        client_name: editingUserRole === 'admin' ? '' : clientName,
        clientIds: editingUserRole === 'admin' ? [] : editingUserClientIds,
        clientNames: editingUserRole === 'admin' ? [] : clientNames
      } : u));
      setEditingUserId(null);
      setEditingUserEmail('');
      setEditingUserPassword('');
      setEditingUserClientIds([]);
      showToast('Usuário atualizado no Sandbox!', 'success');
    } else {
      try {
        setLoading(true);
        const res = await authenticatedFetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUserId,
            email: editingUserEmail,
            password: editingUserPassword,
            role: editingUserRole,
            clientIds: editingUserClientIds,
            clientId: editingUserClientIds[0] || ''
          })
        });
        if (res.ok) {
          const firstId = editingUserClientIds[0] || '';
          const clientName = clients.find(c => c.id === firstId)?.name || '';
          const clientNames = editingUserClientIds.map(id => clients.find(c => c.id === id)?.name || '');
          setUsersList(usersList.map(u => u.id === editingUserId ? {
            ...u,
            email: editingUserEmail,
            role: editingUserRole,
            client_id: editingUserRole === 'admin' ? '' : firstId,
            client_name: editingUserRole === 'admin' ? '' : clientName,
            clientIds: editingUserRole === 'admin' ? [] : editingUserClientIds,
            clientNames: editingUserRole === 'admin' ? [] : clientNames
          } : u));
          setEditingUserId(null);
          setEditingUserEmail('');
          setEditingUserPassword('');
          setEditingUserClientIds([]);
          showToast('Usuário atualizado com sucesso!', 'success');
        } else {
          const data = await res.json();
          showToast(data.error || 'Erro ao atualizar usuário', 'error');
        }
      } catch {
        showToast('Erro de conexão ao atualizar', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter metrics by date range (used locally)
  const filterByDate = <T extends { date: string }>(data: T[]): T[] => {
    const today = new Date();
    let daysToKeep = 30;

    if (dateRange === '7d') {
      daysToKeep = 7;
    } else if (dateRange === '30d') {
      daysToKeep = 30;
    } else if (dateRange === 'this_month') {
      daysToKeep = today.getDate();
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - daysToKeep);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  };

  const filteredMeta = filterByDate(dbData.meta);
  const filteredGoogle = filterByDate(dbData.google);
  const filteredTiktok = filterByDate(dbData.tiktok);

  // Aggregations
  const metaSpend = filteredMeta.reduce((acc, curr) => acc + curr.spend, 0);
  const metaImpressions = filteredMeta.reduce((acc, curr) => acc + curr.impressions, 0);
  const metaClicks = filteredMeta.reduce((acc, curr) => acc + curr.clicks, 0);
  const metaConversions = filteredMeta.reduce((acc, curr) => acc + curr.conversions_actions, 0);

  const googleSpend = filteredGoogle.reduce((acc, curr) => acc + curr.cost, 0);
  const googleImpressions = filteredGoogle.reduce((acc, curr) => acc + curr.impressions, 0);
  const googleClicks = filteredGoogle.reduce((acc, curr) => acc + curr.clicks, 0);
  const googleConversions = filteredGoogle.reduce((acc, curr) => acc + curr.conversions, 0);
  const googleValue = filteredGoogle.reduce((acc, curr) => acc + curr.conversions_value, 0);

  const tiktokSpend = filteredTiktok.reduce((acc, curr) => acc + curr.spend, 0);
  const tiktokImpressions = filteredTiktok.reduce((acc, curr) => acc + curr.impressions, 0);
  const tiktokClicks = filteredTiktok.reduce((acc, curr) => acc + curr.clicks, 0);
  const tiktokConversions = filteredTiktok.reduce((acc, curr) => acc + curr.conversion, 0);

  const totalSpend = metaSpend + googleSpend + tiktokSpend;
  const totalImpressions = metaImpressions + googleImpressions + tiktokImpressions;
  const totalClicks = metaClicks + googleClicks + tiktokClicks;
  const totalConversions = metaConversions + googleConversions + tiktokConversions;

  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const avgROAS = googleSpend > 0 ? googleValue / googleSpend : 0;

  // Pie chart
  const platformDistribution = [
    { name: 'Meta Ads', value: parseFloat(metaSpend.toFixed(2)), color: '#1877F2' },
    { name: 'Google Ads', value: parseFloat(googleSpend.toFixed(2)), color: '#EA4335' },
    { name: 'TikTok Ads', value: parseFloat(tiktokSpend.toFixed(2)), color: '#FE2C55' }
  ];

  // Daily Timeline aggregate
  const getDailyTimeline = () => {
    const dailyMap: { [key: string]: { date: string; spend: number; conversions: number; clicks: number } } = {};

    filteredMeta.forEach((m) => {
      if (!dailyMap[m.date]) dailyMap[m.date] = { date: m.date, spend: 0, conversions: 0, clicks: 0 };
      dailyMap[m.date].spend += m.spend;
      dailyMap[m.date].conversions += m.conversions_actions;
      dailyMap[m.date].clicks += m.clicks;
    });

    filteredGoogle.forEach((g) => {
      if (!dailyMap[g.date]) dailyMap[g.date] = { date: g.date, spend: 0, conversions: 0, clicks: 0 };
      dailyMap[g.date].spend += g.cost;
      dailyMap[g.date].conversions += g.conversions;
      dailyMap[g.date].clicks += g.clicks;
    });

    filteredTiktok.forEach((t) => {
      if (!dailyMap[t.date]) dailyMap[t.date] = { date: t.date, spend: 0, conversions: 0, clicks: 0 };
      dailyMap[t.date].spend += t.spend;
      dailyMap[t.date].conversions += t.conversion;
      dailyMap[t.date].clicks += t.clicks;
    });

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  };

  const timelineData = getDailyTimeline();

  // Combine top campaigns
  const getTopCampaigns = () => {
    const list: { name: string; platform: 'meta' | 'google' | 'tiktok'; spend: number; clicks: number; conversions: number; ctr: number }[] = [];

    const metaCampMap: { [key: string]: { spend: number; clicks: number; impressions: number; conversions: number } } = {};
    filteredMeta.forEach(m => {
      if (!metaCampMap[m.campaign_name]) metaCampMap[m.campaign_name] = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
      metaCampMap[m.campaign_name].spend += m.spend;
      metaCampMap[m.campaign_name].clicks += m.clicks;
      metaCampMap[m.campaign_name].impressions += m.impressions;
      metaCampMap[m.campaign_name].conversions += m.conversions_actions;
    });
    Object.entries(metaCampMap).forEach(([name, s]) => {
      list.push({
        name,
        platform: 'meta',
        spend: s.spend,
        clicks: s.clicks,
        conversions: s.conversions,
        ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0
      });
    });

    const googleCampMap: { [key: string]: { spend: number; clicks: number; impressions: number; conversions: number } } = {};
    filteredGoogle.forEach(g => {
      if (!googleCampMap[g.campaign_name]) googleCampMap[g.campaign_name] = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
      googleCampMap[g.campaign_name].spend += g.cost;
      googleCampMap[g.campaign_name].clicks += g.clicks;
      googleCampMap[g.campaign_name].impressions += g.impressions;
      googleCampMap[g.campaign_name].conversions += g.conversions;
    });
    Object.entries(googleCampMap).forEach(([name, s]) => {
      list.push({
        name,
        platform: 'google',
        spend: s.spend,
        clicks: s.clicks,
        conversions: s.conversions,
        ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0
      });
    });

    const tiktokCampMap: { [key: string]: { spend: number; clicks: number; impressions: number; conversions: number } } = {};
    filteredTiktok.forEach(t => {
      if (!tiktokCampMap[t.campaign_name]) tiktokCampMap[t.campaign_name] = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
      tiktokCampMap[t.campaign_name].spend += t.spend;
      tiktokCampMap[t.campaign_name].clicks += t.clicks;
      tiktokCampMap[t.campaign_name].impressions += t.impressions;
      tiktokCampMap[t.campaign_name].conversions += t.conversion;
    });
    Object.entries(tiktokCampMap).forEach(([name, s]) => {
      list.push({
        name,
        platform: 'tiktok',
        spend: s.spend,
        clicks: s.clicks,
        conversions: s.conversions,
        ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0
      });
    });

    return list.sort((a, b) => b.spend - a.spend);
  };

  const topCampaigns = getTopCampaigns();

  const isMetaConnected = !!(creds.meta.accountId && creds.meta.appId && creds.meta.accessToken);
  const isGoogleConnected = !!(creds.google.customerId && creds.google.devToken && creds.google.clientId && creds.google.clientSecret && creds.google.refreshToken);
  const isTiktokConnected = !!(creds.tiktok.advertiserId && creds.tiktok.appId && creds.tiktok.secret && creds.tiktok.accessToken);

  // LOGIN PAGE VIEW RENDER
  if (!token || !currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #0f172a 0%, #020617 100%)',
        fontFamily: 'var(--font-body)',
        padding: '20px'
      }}>
        {/* Toast inside login */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(99, 102, 241, 0.95)',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            fontSize: '14px',
            fontWeight: 600
          }}>
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }} className="fade-in">
          
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '16px',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
            }}>
              <Layers size={24} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.8px', color: '#fff' }}>Dnexus</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>Dashboard de Tráfego Pago Consolidado</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                required
                placeholder="Ex: admin@dnexus.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="Sua senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="control-btn control-btn-primary"
              style={{ justifyContent: 'center', padding: '14px', borderRadius: '12px', fontWeight: 600, width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar no Painel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 20px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(99, 102, 241, 0.95)',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          fontSize: '14px',
          fontWeight: 600
        }}>
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Layers size={18} />
          </div>
          <span>Dnexus</span>
        </div>

        <ul className="sidebar-menu">
          <li className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span className="menu-item-icon"><Database size={18} /></span>
            <span>Visão Geral</span>
          </li>
          <li className={`menu-item ${activeTab === 'meta' ? 'active' : ''}`} onClick={() => setActiveTab('meta')}>
            <span className="menu-item-icon"><MetaLogo /></span>
            <span>Meta Ads</span>
          </li>
          <li className={`menu-item ${activeTab === 'google' ? 'active' : ''}`} onClick={() => setActiveTab('google')}>
            <span className="menu-item-icon"><GoogleLogo /></span>
            <span>Google Ads</span>
          </li>
          <li className={`menu-item ${activeTab === 'tiktok' ? 'active' : ''}`} onClick={() => setActiveTab('tiktok')}>
            <span className="menu-item-icon"><TikTokLogo /></span>
            <span>TikTok Ads</span>
          </li>
          
          {currentUser.role === 'admin' && (
            <>
              <li className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                <span className="menu-item-icon"><Settings size={18} /></span>
                <span>Conexões API</span>
              </li>
              <li className={`menu-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
                <span className="menu-item-icon"><Users size={18} /></span>
                <span>Clientes & Logins</span>
              </li>
            </>
          )}
        </ul>

        {/* User profile section at the bottom of sidebar */}
        <div style={{ padding: '16px 0', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentUser.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentUser.role === 'admin' ? 'var(--color-primary)' : 'var(--color-success)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {currentUser.role === 'admin' ? <Shield size={16} /> : currentUser.email.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {currentUser.role === 'admin' ? 'Admin Master' : currentUser.clientName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="menu-item" style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
            <span className="menu-item-icon"><LogOut size={14} /></span>
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        {/* Header */}
        <header className="header-container">
          <div className="header-title">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeTab === 'overview' && 'Dashboard Consolidado'}
              {activeTab === 'meta' && 'Desempenho Meta Ads'}
              {activeTab === 'google' && 'Desempenho Google Ads'}
              {activeTab === 'tiktok' && 'Desempenho TikTok Ads'}
              {activeTab === 'settings' && 'Integrações de Tráfego'}
              {activeTab === 'clients' && 'Gestão de Empresas & Logins'}
              
              {currentUser.role === 'client' && (
                <span className="badge badge-success" style={{ fontSize: '10px' }}>{currentUser.clientName}</span>
              )}
            </h1>
            <p>
              {activeTab === 'overview' && 'Visão unificada das campanhas de tráfego pago.'}
              {activeTab === 'meta' && 'Métricas detalhadas do Facebook e Instagram Ads.'}
              {activeTab === 'google' && 'Análise de conversões e pesquisa do Google Ads.'}
              {activeTab === 'tiktok' && 'Métricas de engajamento e conversão de vídeos do TikTok.'}
              {activeTab === 'settings' && 'Gerencie credenciais e consulte o passo a passo para conectar as APIs.'}
              {activeTab === 'clients' && 'Painel de controle para criação de contas de clientes e empresas.'}
            </p>
          </div>

          <div className="header-controls">
            {loading && <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginRight: '8px' }}>Carregando...</span>}
            
            {/* Multi-client selector */}
            {((currentUser.role === 'admin') || (currentUser.role === 'client' && currentUser.clients && currentUser.clients.length > 1)) && activeTab !== 'clients' && (
              <select className="date-selector" style={{ border: '1px solid var(--color-primary)' }} value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                {currentUser.role === 'admin' && <option value="" disabled>Selecione um Cliente</option>}
                {(currentUser.role === 'admin' ? clients : (currentUser.clients || [])).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {activeTab !== 'settings' && activeTab !== 'clients' && (
              <select className="date-selector" value={dateRange} onChange={(e) => setDateRange(e.target.value as any)}>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="this_month">Mês Atual</option>
              </select>
            )}

            {activeTab !== 'clients' && (
              <button className="control-btn control-btn-primary" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={syncing ? 'spin-anim' : ''} size={16} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Sincronizando...' : 'Atualizar Dados'}
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Content based on Active Tab */}
        {activeTab === 'overview' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Warning if Admin has no client selected */}
            {currentUser.role === 'admin' && !selectedClientId ? (
              <div className="panel-card" style={{ border: '1px dashed var(--color-primary)', alignItems: 'center', padding: '50px 20px', textAlign: 'center' }}>
                <Layers size={36} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                <span className="panel-card-title">Selecione um Cliente para ver o Painel</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', marginTop: '6px' }}>
                  Como administrador, você deve selecionar um cliente no menu superior para visualizar os relatórios e métricas de tráfego.
                </p>
              </div>
            ) : (
              <>
                {/* KPI Cards Grid */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Investimento Total</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">R$ {totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="kpi-trend up" style={{ marginTop: '8px' }}>
                        <TrendingUp size={14} />
                        <span>CPC Médio:</span>
                        <span className="kpi-trend-lbl">R$ {avgCPC.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Cliques Totais</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-accent)' }}>
                        <MousePointerClick size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{totalClicks.toLocaleString('pt-BR')}</div>
                      <div className="kpi-trend up" style={{ marginTop: '8px' }}>
                        <TrendingUp size={14} />
                        <span>CTR Médio:</span>
                        <span className="kpi-trend-lbl">{avgCTR.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Conversões unificadas</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-success-glow)', color: 'var(--color-success)' }}>
                        <Target size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{Math.round(totalConversions).toLocaleString('pt-BR')}</div>
                      <div className="kpi-trend up" style={{ marginTop: '8px' }}>
                        <TrendingUp size={14} />
                        <span>CPA Médio:</span>
                        <span className="kpi-trend-lbl">R$ {avgCPA.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Impressões Consolidadas</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: 'var(--color-secondary)' }}>
                        <Eye size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{totalImpressions.toLocaleString('pt-BR')}</div>
                      <div className="kpi-trend down" style={{ marginTop: '8px' }}>
                        <TrendingDown size={14} />
                        <span style={{ color: 'var(--text-secondary)' }}>Frequência ideal</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="dashboard-row">
                  <div className="panel-card">
                    <div className="panel-card-header">
                      <div>
                        <span className="panel-card-title">Investimento vs Conversões</span>
                        <p className="panel-card-subtitle">Evolução diária consolidada de gastos e resultados.</p>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 350 }}>
                      <ResponsiveContainer>
                        <AreaChart data={timelineData}>
                          <defs>
                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                            </linearGradient>
                            <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                          <YAxis yAxisId="left" stroke="var(--color-primary)" fontSize={12} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="var(--color-success)" fontSize={12} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }} />
                          <Area yAxisId="left" type="monotone" dataKey="spend" name="Investimento (R$)" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                          <Area yAxisId="right" type="monotone" dataKey="conversions" name="Conversões" stroke="var(--color-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="panel-card">
                    <div className="panel-card-header">
                      <div>
                        <span className="panel-card-title">Distribuição de Verba</span>
                        <p className="panel-card-subtitle">Divisão percentual do investimento por canal.</p>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {platformDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `R$ ${parseFloat(value as string).toLocaleString('pt-BR')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="platform-list">
                      {platformDistribution.map((p, idx) => {
                        const pct = totalSpend > 0 ? (p.value / totalSpend) * 100 : 0;
                        return (
                          <div className="platform-row-item" key={idx}>
                            <div className="platform-info">
                              <span className="platform-dot" style={{ backgroundColor: p.color }}></span>
                              <span className="platform-label">{p.name}</span>
                            </div>
                            <div className="platform-stats">
                              <div className="platform-val">R$ {p.value.toLocaleString('pt-BR')}</div>
                              <div className="platform-pct">{pct.toFixed(1)}% do total</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Campaigns Table */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <div>
                      <span className="panel-card-title">Melhores Campanhas (Por Investimento)</span>
                      <p className="panel-card-subtitle">Listagem de campanhas ordenadas pelo valor investido.</p>
                    </div>
                  </div>
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Campanha</th>
                          <th>Plataforma</th>
                          <th>Investido</th>
                          <th>Cliques</th>
                          <th>CTR</th>
                          <th>Conversões</th>
                          <th>CPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCampaigns.slice(0, 8).map((c, i) => {
                          const cpa = c.conversions > 0 ? c.spend / c.conversions : 0;
                          return (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{c.name}</td>
                              <td>
                                {c.platform === 'meta' && <span className="badge badge-meta">Meta Ads</span>}
                                {c.platform === 'google' && <span className="badge badge-google">Google Ads</span>}
                                {c.platform === 'tiktok' && <span className="badge badge-tiktok">TikTok Ads</span>}
                              </td>
                              <td>R$ {c.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td>{c.clicks.toLocaleString('pt-BR')}</td>
                              <td>{c.ctr.toFixed(2)}%</td>
                              <td>{Math.round(c.conversions).toLocaleString('pt-BR')}</td>
                              <td>
                                {cpa > 0 
                                  ? `R$ ${cpa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                  : '-'
                                }
                              </td>
                            </tr>
                          );
                        })}
                        {topCampaigns.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum dado encontrado para este cliente neste período. Clique em Sincronizar.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'meta' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {currentUser.role === 'admin' && !selectedClientId ? (
              <div className="panel-card" style={{ border: '1px dashed var(--color-primary)', alignItems: 'center', padding: '50px 20px', textAlign: 'center' }}>
                <span className="panel-card-title">Selecione um Cliente para ver o Painel</span>
              </div>
            ) : (
              <>
                {/* Meta KPI Cards */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Gasto Meta</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-meta-glow)', color: 'var(--color-meta)' }}>
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">R$ {metaSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Impressões</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        <Eye size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{metaImpressions.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Cliques</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        <MousePointerClick size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{metaClicks.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Ações de Conversão</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-success-glow)', color: 'var(--color-success)' }}>
                        <Target size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{metaConversions.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <span className="panel-card-title">Métricas de Campanha Real (Meta Nomenclaturas)</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID da Campanha</th>
                          <th>Nome da Campanha</th>
                          <th>Alcance (Reach)</th>
                          <th>Impressões</th>
                          <th>Cliques</th>
                          <th>Valor Gasto (Spend)</th>
                          <th>Ações Totais</th>
                          <th>CPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMeta.slice(0, 15).map((m, idx) => {
                          const cpa = m.conversions_actions > 0 ? m.spend / m.conversions_actions : 0;
                          return (
                            <tr key={idx}>
                              <td>{m.campaign_id}</td>
                              <td style={{ fontWeight: 600 }}>{m.campaign_name}</td>
                              <td>{m.reach.toLocaleString('pt-BR')}</td>
                              <td>{m.impressions.toLocaleString('pt-BR')}</td>
                              <td>{m.clicks.toLocaleString('pt-BR')}</td>
                              <td>R$ {m.spend.toLocaleString('pt-BR')}</td>
                              <td>{m.conversions_actions}</td>
                              <td>R$ {cpa.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'google' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {currentUser.role === 'admin' && !selectedClientId ? (
              <div className="panel-card" style={{ border: '1px dashed var(--color-primary)', alignItems: 'center', padding: '50px 20px', textAlign: 'center' }}>
                <span className="panel-card-title">Selecione um Cliente para ver o Painel</span>
              </div>
            ) : (
              <>
                {/* Google KPI Cards */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Custo Google (Cost)</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-google-glow)', color: 'var(--color-google)' }}>
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">R$ {googleSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Conversões Google</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-success-glow)', color: 'var(--color-success)' }}>
                        <Target size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{googleConversions.toFixed(1)}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Valor de Conversão</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-accent)' }}>
                        <ArrowUpRight size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">R$ {googleValue.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">ROAS do Canal</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: 'var(--color-secondary)' }}>
                        <Percent size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{avgROAS.toFixed(2)}x</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <span className="panel-card-title">Métricas de Campanha (Google Nomenclaturas)</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID da Campanha</th>
                          <th>Nome da Campanha</th>
                          <th>Impressões</th>
                          <th>Cliques</th>
                          <th>Custo (Cost)</th>
                          <th>Conversões</th>
                          <th>Valor de Conversão</th>
                          <th>ROAS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGoogle.slice(0, 15).map((g, idx) => {
                          const roas = g.cost > 0 ? g.conversions_value / g.cost : 0;
                          return (
                            <tr key={idx}>
                              <td>{g.campaign_id}</td>
                              <td style={{ fontWeight: 600 }}>{g.campaign_name}</td>
                              <td>{g.impressions.toLocaleString('pt-BR')}</td>
                              <td>{g.clicks.toLocaleString('pt-BR')}</td>
                              <td>R$ {g.cost.toLocaleString('pt-BR')}</td>
                              <td>{g.conversions}</td>
                              <td>R$ {g.conversions_value.toLocaleString('pt-BR')}</td>
                              <td>{roas.toFixed(2)}x</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'tiktok' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {currentUser.role === 'admin' && !selectedClientId ? (
              <div className="panel-card" style={{ border: '1px dashed var(--color-primary)', alignItems: 'center', padding: '50px 20px', textAlign: 'center' }}>
                <span className="panel-card-title">Selecione um Cliente para ver o Painel</span>
              </div>
            ) : (
              <>
                {/* TikTok KPI Cards */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Gasto TikTok (Spend)</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-tiktok-glow)', color: 'var(--color-tiktok)' }}>
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">R$ {tiktokSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Visualizações de Vídeo</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        <Eye size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{tiktokImpressions.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Cliques</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        <MousePointerClick size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{tiktokClicks.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Conversões</span>
                      <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-success-glow)', color: 'var(--color-success)' }}>
                        <Target size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-value">{tiktokConversions.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <span className="panel-card-title">Métricas de Campanha (TikTok Nomenclaturas)</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID da Campanha</th>
                          <th>Nome da Campanha</th>
                          <th>Impressões</th>
                          <th>Cliques</th>
                          <th>Custo (Spend)</th>
                          <th>Conversão (Conversion)</th>
                          <th>Conversão Tempo Real (Real-time)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTiktok.slice(0, 15).map((t, idx) => {
                          return (
                            <tr key={idx}>
                              <td>{t.campaign_id}</td>
                              <td style={{ fontWeight: 600 }}>{t.campaign_name}</td>
                              <td>{t.impressions.toLocaleString('pt-BR')}</td>
                              <td>{t.clicks.toLocaleString('pt-BR')}</td>
                              <td>R$ {t.spend.toLocaleString('pt-BR')}</td>
                              <td>{t.conversion}</td>
                              <td>{t.real_time_conversion}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* API Credentials Management (Admin only) */}
        {activeTab === 'settings' && currentUser.role === 'admin' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {!selectedClientId ? (
              <div className="panel-card" style={{ border: '1px dashed var(--color-primary)', alignItems: 'center', padding: '50px 20px', textAlign: 'center' }}>
                <span className="panel-card-title">Selecione um Cliente no menu superior antes de gerenciar conexões</span>
              </div>
            ) : (
              <div className="settings-grid">
                
                {/* META ADS CARD */}
                <div className="credential-card">
                  <div className="credential-card-header">
                    <div className="platform-logo-title">
                      <MetaLogo />
                      <span>Meta Ads API</span>
                    </div>
                    <span className={`badge ${isMetaConnected ? 'badge-success' : 'badge-meta'}`}>
                      {isMetaConnected ? 'Conectado' : 'Conexão Pendente'}
                    </span>
                  </div>

                  <div className="wizard-container">
                    <div className="wizard-step active">
                      <div className="wizard-step-title">Passo 1: Criar Aplicativo de Desenvolvedor</div>
                      <div className="wizard-step-desc">
                        Acesse o portal <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>developers.facebook.com</a>, crie um novo aplicativo do tipo <strong>Outro / Negócios</strong> e adicione o produto <strong>Marketing API</strong>.
                      </div>
                    </div>
                    <div className="wizard-step active">
                      <div className="wizard-step-title">Passo 2: Obter o App ID e App Secret</div>
                      <div className="wizard-step-desc">
                        Vá em <i>Configurações &gt; Básico</i> no painel do app e copie o <code>App ID</code> e o <code>App Secret</code>.
                      </div>
                    </div>
                    <div className="wizard-step active">
                      <div className="wizard-step-title">Passo 3: Gerar Token de Acesso de Longa Duração</div>
                      <div className="wizard-step-desc">
                        No <strong>Gerenciador de Negócios</strong> (Business Manager), vá em <i>Usuários do Sistema</i>, selecione o usuário (ou crie um) com permissões em sua Conta de Anúncios e gere um token permanente com as permissões: <code>ads_read</code> e <code>read_insights</code>.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">ID da Conta de Anúncios (Ad Account ID)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: act_1234567890"
                        value={creds.meta.accountId}
                        onChange={(e) => setCreds({ ...creds, meta: { ...creds.meta, accountId: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">App ID (ID do Aplicativo)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 583940294829384"
                        value={creds.meta.appId}
                        onChange={(e) => setCreds({ ...creds, meta: { ...creds.meta, appId: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">App Secret (Segredo do Aplicativo)</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="••••••••••••••••"
                        value={creds.meta.appSecret}
                        onChange={(e) => setCreds({ ...creds, meta: { ...creds.meta, appSecret: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Token de Acesso do Usuário (Access Token)</label>
                      <textarea
                        className="form-input"
                        style={{ minHeight: '60px', fontFamily: 'monospace', resize: 'vertical' }}
                        placeholder="EAAGm..."
                        value={creds.meta.accessToken}
                        onChange={(e) => setCreds({ ...creds, meta: { ...creds.meta, accessToken: e.target.value } })}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="date-selector" onClick={() => handleSaveCredentials('meta')}>Salvar Credenciais</button>
                  </div>
                </div>

                {/* GOOGLE ADS CARD */}
                <div className="credential-card">
                  <div className="credential-card-header">
                    <div className="platform-logo-title">
                      <GoogleLogo />
                      <span>Google Ads API</span>
                    </div>
                    <span className={`badge ${isGoogleConnected ? 'badge-success' : 'badge-google'}`}>
                      {isGoogleConnected ? 'Conectado' : 'Conexão Pendente'}
                    </span>
                  </div>

                  <div className="wizard-container">
                    <div className="wizard-step active">
                      <div className="wizard-step-title">Passo 1: Token de Desenvolvedor (Developer Token)</div>
                      <div className="wizard-step-desc">
                        No painel da sua conta administradora do Google Ads (MCC), vá em <i>Ferramentas e Configurações &gt; Central de API</i> e solicite o <code>Developer Token</code> básico ou de teste.
                      </div>
                    </div>
                    <div className="wizard-step active">
                      <div className="wizard-step-title">Passo 2: Configurar o Google Cloud e OAuth2</div>
                      <div className="wizard-step-desc">
                        Crie um projeto no <strong>Google Cloud Console</strong>, ative a API <code>Google Ads API</code>, crie uma tela de consentimento OAuth externa e gere credenciais de ID do Cliente Web. Adicione <code>https://developers.google.com/oauthplayground</code> nas URLs de redirecionamento autorizadas para pegar o <code>Refresh Token</code>.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">ID de Cliente (Customer ID)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 123-456-7890"
                        value={creds.google.customerId}
                        onChange={(e) => setCreds({ ...creds, google: { ...creds.google, customerId: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Developer Token</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Token gerado na Central de API do Google Ads"
                        value={creds.google.devToken}
                        onChange={(e) => setCreds({ ...creds, google: { ...creds.google, devToken: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">OAuth Client ID</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="..."
                        value={creds.google.clientId}
                        onChange={(e) => setCreds({ ...creds, google: { ...creds.google, clientId: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">OAuth Client Secret</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="..."
                        value={creds.google.clientSecret}
                        onChange={(e) => setCreds({ ...creds, google: { ...creds.google, clientSecret: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">OAuth Refresh Token</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Gere via OAuth Playground usando o Client ID"
                        value={creds.google.refreshToken}
                        onChange={(e) => setCreds({ ...creds, google: { ...creds.google, refreshToken: e.target.value } })}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="date-selector" onClick={() => handleSaveCredentials('google')}>Salvar Credenciais</button>
                  </div>
                </div>

                {/* TIKTOK ADS CARD */}
                <div className="credential-card" style={{ gridColumn: 'span 2' }}>
                  <div className="credential-card-header">
                    <div className="platform-logo-title">
                      <TikTokLogo />
                      <span>TikTok Ads API</span>
                    </div>
                    <span className={`badge ${isTiktokConnected ? 'badge-success' : 'badge-tiktok'}`}>
                      {isTiktokConnected ? 'Conectado' : 'Conexão Pendente'}
                    </span>
                  </div>

                  <div className="wizard-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <div className="wizard-step active">
                        <div className="wizard-step-title">Passo 1: Criar Aplicativo de Desenvolvedor</div>
                        <div className="wizard-step-desc">
                          Acesse <a href="https://ads.tiktok.com/marketing_api/homepage" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>ads.tiktok.com/marketing_api</a>, registre-se como Desenvolvedor e crie um aplicativo.
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="wizard-step active">
                        <div className="wizard-step-title">Passo 2: Obter Permissões e Token</div>
                        <div className="wizard-step-desc">
                          Aprove as permissões de anúncio do aplicativo e solicite o Token de Acesso permanente no console.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Advertiser ID (ID do Anunciante)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 739485038475932"
                        value={creds.tiktok.advertiserId}
                        onChange={(e) => setCreds({ ...creds, tiktok: { ...creds.tiktok, advertiserId: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">App ID</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="..."
                        value={creds.tiktok.appId}
                        onChange={(e) => setCreds({ ...creds, tiktok: { ...creds.tiktok, appId: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Secret</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="..."
                        value={creds.tiktok.secret}
                        onChange={(e) => setCreds({ ...creds, tiktok: { ...creds.tiktok, secret: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Access Token</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="..."
                        value={creds.tiktok.accessToken}
                        onChange={(e) => setCreds({ ...creds, tiktok: { ...creds.tiktok, accessToken: e.target.value } })}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="date-selector" onClick={() => handleSaveCredentials('tiktok')}>Salvar Credenciais</button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Clients & Logins Management Panel (Admin only) */}
        {activeTab === 'clients' && currentUser.role === 'admin' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px' }}>
              
              {/* Form Create/Edit Client */}
              <div className="panel-card">
                <span className="panel-card-title">
                  {editingClientId ? 'Editar Empresa / Cliente' : 'Nova Empresa / Cliente'}
                </span>
                <form onSubmit={editingClientId ? handleUpdateClient : handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Nome da Empresa</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Ex: Empresa X S/A"
                      value={editingClientId ? editingClientName : newClientName}
                      onChange={(e) => editingClientId ? setEditingClientName(e.target.value) : setNewClientName(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="control-btn control-btn-primary" style={{ padding: '12px', justifyContent: 'center', flex: 1 }}>
                      {editingClientId ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                      <span>{editingClientId ? 'Salvar' : 'Cadastrar Empresa'}</span>
                    </button>
                    {editingClientId && (
                      <button type="button" className="control-btn" style={{ padding: '12px', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }} onClick={() => { setEditingClientId(null); setEditingClientName(''); }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </form>

                <div style={{ marginTop: '20px' }}>
                  <span className="form-label" style={{ display: 'block', marginBottom: '10px' }}>Empresas Cadastradas ({clients.length})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                    {clients.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>ID: {c.id}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setEditingClientId(c.id); setEditingClientName(c.name); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }} title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteClient(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }} title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Create/Edit User & User List */}
              <div className="panel-card" style={{ gap: '28px' }}>
                <div>
                  <span className="panel-card-title">
                    {editingUserId ? 'Editar Login de Acesso' : 'Novo Login de Acesso'}
                  </span>
                  <p className="panel-card-subtitle" style={{ marginBottom: '16px' }}>
                    {editingUserId
                      ? 'Edite os dados do login de acesso. Deixe a senha em branco se não desejar alterá-la.'
                      : 'Crie logins para que clientes consigam ver exclusivamente seus dados ou novos administradores.'}
                  </p>
                  
                  <form onSubmit={editingUserId ? handleUpdateUser : handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">E-mail do Usuário</label>
                      <input
                        type="email"
                        className="form-input"
                        required
                        placeholder="Ex: fulano@empresa.com"
                        value={editingUserId ? editingUserEmail : newUserEmail}
                        onChange={(e) => editingUserId ? setEditingUserEmail(e.target.value) : setNewUserEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Senha {editingUserId && '(Deixe em branco para não alterar)'}</label>
                      <input
                        type="password"
                        className="form-input"
                        required={!editingUserId}
                        placeholder={editingUserId ? 'Nova senha opcional' : 'Senha provisória'}
                        value={editingUserId ? editingUserPassword : newUserPassword}
                        onChange={(e) => editingUserId ? setEditingUserPassword(e.target.value) : setNewUserPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nível de Acesso (Cargo)</label>
                      <select className="date-selector" style={{ width: '100%' }} value={editingUserId ? editingUserRole : newUserRole} onChange={(e) => editingUserId ? setEditingUserRole(e.target.value as any) : setNewUserRole(e.target.value as any)}>
                        <option value="client">Cliente Comum (Isolado)</option>
                        <option value="admin">Administrador Master (Total)</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Empresas Vinculadas (Selecione uma ou mais para Cliente)</label>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-color)',
                        padding: '12px',
                        borderRadius: '8px',
                        opacity: ((editingUserId ? editingUserRole : newUserRole) === 'admin') ? 0.5 : 1,
                        pointerEvents: ((editingUserId ? editingUserRole : newUserRole) === 'admin') ? 'none' : 'auto',
                        backgroundColor: 'rgba(255,255,255,0.02)'
                      }}>
                        {clients.map(c => {
                          const isChecked = editingUserId 
                            ? editingUserClientIds.includes(c.id) 
                            : newUserClientIds.includes(c.id);
                          return (
                            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (editingUserId) {
                                    if (e.target.checked) {
                                      setEditingUserClientIds([...editingUserClientIds, c.id]);
                                    } else {
                                      setEditingUserClientIds(editingUserClientIds.filter(id => id !== c.id));
                                    }
                                  } else {
                                    if (e.target.checked) {
                                      setNewUserClientIds([...newUserClientIds, c.id]);
                                    } else {
                                      setNewUserClientIds(newUserClientIds.filter(id => id !== c.id));
                                    }
                                  }
                                }}
                              />
                              <span>{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button type="submit" className="control-btn control-btn-primary" style={{ padding: '12px', justifyContent: 'center', flex: 1 }}>
                        {editingUserId ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                        <span>{editingUserId ? 'Salvar Alterações' : 'Criar Login do Usuário'}</span>
                      </button>
                      {editingUserId && (
                        <button type="button" className="control-btn" style={{ padding: '12px', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }} onClick={() => { setEditingUserId(null); setEditingUserEmail(''); setEditingUserPassword(''); }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div>
                  <span className="panel-card-title" style={{ display: 'block', marginBottom: '12px' }}>Contas Ativas</span>
                  <div className="table-wrapper">
                    <table className="custom-table" style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>E-mail</th>
                          <th>Cargo</th>
                          <th>Empresa Associada</th>
                          <th>Criado Em</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((u, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{u.email}</td>
                            <td>
                              {u.role === 'admin' ? (
                                <span className="badge badge-meta">Admin Master</span>
                              ) : (
                                <span className="badge badge-success">Cliente</span>
                              )}
                            </td>
                            <td style={{ color: u.role === 'admin' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                              {u.role === 'admin' ? 'Acesso Total' : (u.clientNames && u.clientNames.length > 0 ? u.clientNames.join(', ') : (u.client_name || 'Desconhecida'))}
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>
                              {new Date(u.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={() => {
                                  setEditingUserId(u.id);
                                  setEditingUserEmail(u.email);
                                  setEditingUserRole(u.role as any);
                                  setEditingUserClientId(u.client_id || '');
                                  setEditingUserClientIds(u.clientIds || (u.client_id ? [u.client_id] : []));
                                  setEditingUserPassword('');
                                }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }} title="Editar">
                                  <Edit2 size={14} />
                                </button>
                                {u.id !== currentUser?.id && (
                                  <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }} title="Excluir">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
