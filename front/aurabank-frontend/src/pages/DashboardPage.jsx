import { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';
import AuthModal from '../components/AuthModal';

function DashboardPage() {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [message, setMessage] = useState('Loading...');
    const navigate = useNavigate();
    const [transferData, setTransferData] = useState({ recipient_account_number: '', amount: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingTransfer, setPendingTransfer] = useState(null);

    // This function fetches the transaction history
    const fetchTransactionHistory = async (userId) => {
        try {
            const response = await apiClient.get(`/api/user/${userId}/transactions`);
            if (response.data.status === 'success') {
                setTransactions(response.data.transactions);
            }
        } catch (error) {
            console.error("Failed to fetch transaction history", error);
        }
    };

    // This hook runs once when the component loads to get all initial data
    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            navigate('/login');
            return;
        }

        const fetchInitialData = async () => {
            try {
                const userResponse = await apiClient.get(`/api/user/${userId}`);
                if (userResponse.data.status === 'success') {
                    setUser(userResponse.data.user);
                    setMessage('');
                    // After fetching user data, fetch their transactions
                    fetchTransactionHistory(userId);
                } else {
                    setMessage(userResponse.data.message);
                }
            } catch (error) {
                setMessage('Failed to fetch user data.');
                console.error('Fetch user data error:', error);
            }
        };

        fetchInitialData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user_id');
        navigate('/login');
    };

    const handleTransferChange = (e) => {
        setTransferData({ ...transferData, [e.target.name]: e.target.value });
    };

    const handleTransferSubmit = (e) => {
        e.preventDefault();
        setPendingTransfer(transferData);
        setIsModalOpen(true);
    };

    const onTransferSuccess = (data) => {
        setIsModalOpen(false);
        setMessage(data.message);
        setUser({ ...user, balance: data.new_balance });
        setTransferData({ recipient_account_number: '', amount: '' });
        
        const userId = localStorage.getItem('user_id');
        if (userId) {
            fetchTransactionHistory(userId);
        }
    };

    if (!user) {
        return <div className="App"><p>{message}</p></div>;
    }

    return (
        <>
            <AuthModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onTransferSuccess}
                transferDetails={pendingTransfer}
            />
            <div className="form-container">
                <h1>Dashboard</h1>
                <h2>Welcome back, {user.name}!</h2>
                <div style={{ textAlign: 'left', marginTop: '2rem' }}>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Account #:</strong> {user.account_number}</p>
                    <h3 style={{ marginTop: '1.5rem' }}>Balance: ₹{user.balance.toFixed(2)}</h3>
                </div>
                <div className="transfer-container" style={{ marginTop: '2rem' }}>
                    <h3>Send Money</h3>
                    <form onSubmit={handleTransferSubmit}>
                        <input
                            type="text"
                            name="recipient_account_number"
                            placeholder="Recipient's Account Number"
                            value={transferData.recipient_account_number}
                            onChange={handleTransferChange}
                            required
                        />
                        <input
                            type="number"
                            name="amount"
                            placeholder="Amount in ₹"
                            value={transferData.amount}
                            onChange={handleTransferChange}
                            required
                        />
                        <button type="submit">Send Money</button>
                    </form>
                    {message && <p className="message">{message}</p>}
                </div>

                <div className="history-container" style={{ marginTop: '2rem' }}>
                    <h3>Transaction History</h3>
                    <div className="transaction-list">
                        {transactions.length > 0 ? (
                            transactions.map((tx, index) => (
                                <div className="transaction-item" key={index}>
                                    <div className="transaction-details">
                                        <span className="tx-name">{tx.other_party_name}</span>
                                        <span className="tx-time">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <span className={tx.type === 'sent' ? 'tx-amount-sent' : 'tx-amount-received'}>
                                        {tx.type === 'sent' ? '- ' : '+ '}
                                        ₹{tx.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p>No transactions yet.</p>
                        )}
                    </div>
                </div>
                <div className="dashboard-actions">        
                <Link to="/enroll-face" style={{color: 'white', marginTop: '1rem', display: 'block'}}>
                    Enroll Face for 2FA Login
                </Link>
                </div>
                <div className="dashboard-actions">
                <button onClick={handleLogout} style={{ marginTop: '2rem', backgroundColor: '#555' }}>Logout</button>
                </div>
            </div>
        </>
    );
}

export default DashboardPage;