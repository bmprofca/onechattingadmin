import React, { useState, useEffect, useCallback } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { useNavigate } from 'react-router-dom';
import {
    FiCheckCircle, FiClock, FiTrendingUp, FiPackage,
    FiRefreshCw, FiXCircle, FiEdit2, FiSave, FiDollarSign,
    FiPercent, FiAward, FiStar, FiZap, FiLock
} from 'react-icons/fi';
import axios from 'axios';
import { Encrypt } from '../pages/encryption/payload-encryption';

const AllSubscriptions = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [tokens, setTokens] = useState(null);
    const [packagePrices, setPackagePrices] = useState({
        monthly_package: null,
        yearly_package: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editPrices, setEditPrices] = useState({
        monthly_package: '',
        yearly_package: ''
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    useEffect(() => {
        const data = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Fetch package prices
    const fetchPackagePrices = useCallback(async () => {
        if (!tokens?.token) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(
                'https://api.w1chat.com/admin/packages',
                {
                    headers: { 'x-token': tokens.token }
                }
            );

            if (!response.data.error && response.data.data) {
                const monthlyAmount = response.data.data.monthly_package;
                const yearlyAmount = response.data.data.yearly_package;
                
                setPackagePrices({
                    monthly_package: monthlyAmount,
                    yearly_package: yearlyAmount
                });
                setEditPrices({
                    monthly_package: monthlyAmount,
                    yearly_package: yearlyAmount
                });
            }
        } catch (err) {
            console.error("Failed to fetch package prices", err);
            setError(err.response?.data?.error || 'Failed to load package prices');
            
            if (err.response?.status === 500) {
                console.error("Server error details:", err.response.data.e);
                setError('Server error. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    }, [tokens]);

    // Update package prices with encryption
    const updatePackagePrices = async () => {
        if (!tokens?.token) return;
        
        // Validate inputs
        if (!editPrices.monthly_package || !editPrices.yearly_package) {
            setError('Both monthly and yearly prices are required');
            return;
        }

        const monthlyAmount = Number(editPrices.monthly_package);
        const yearlyAmount = Number(editPrices.yearly_package);

        if (monthlyAmount <= 0 || yearlyAmount <= 0) {
            setError('Prices must be greater than 0');
            return;
        }

        if (isNaN(monthlyAmount) || isNaN(yearlyAmount)) {
            setError('Please enter valid numbers');
            return;
        }
        
        try {
            setUpdating(true);
            setError(null);
            setSuccess(null);

            // Prepare data for encryption
            const payload = {
                monthly_package: monthlyAmount,
                yearly_package: yearlyAmount
            };

            // Encrypt the data using the imported Encrypt function
            const encryptedData = Encrypt(payload);

            // Make the API call with encrypted data
            const response = await axios.patch(
                'https://api.w1chat.com/admin/update-packages',
                encryptedData,  // This already contains { data, key }
                {
                    headers: { 'x-token': tokens.token }
                }
            );

            if (!response.data.error) {
                setSuccess('Packages updated successfully!');
                setPackagePrices({
                    monthly_package: monthlyAmount,
                    yearly_package: yearlyAmount
                });
                setIsEditing(false);
                
                // Refresh the prices
                await fetchPackagePrices();
            }
        } catch (err) {
            console.error("Failed to update package prices", err);
            
            // Handle different error responses
            if (err.response?.status === 400) {
                setError(err.response.data.error || 'Invalid data provided');
            } else if (err.response?.status === 500) {
                console.error("Server error details:", err.response.data.e);
                setError('Server error. Please try again later.');
            } else {
                setError(err.response?.data?.error || 'Failed to update package prices');
            }
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        if (tokens?.token) {
            fetchPackagePrices();
        }
    }, [fetchPackagePrices, tokens]);

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹0';
        return `₹${parseInt(amount).toLocaleString('en-IN')}`;
    };

    const calculateSavings = () => {
        if (packagePrices.monthly_package && packagePrices.yearly_package) {
            const monthlyTotal = packagePrices.monthly_package * 12;
            const yearlyTotal = packagePrices.yearly_package;
            const savings = monthlyTotal - yearlyTotal;
            const savingsPercent = savings > 0 ? ((savings / monthlyTotal) * 100).toFixed(0) : 0;
            return { savings, savingsPercent };
        }
        return { savings: 0, savingsPercent: 0 };
    };

    const { savings, savingsPercent } = calculateSavings();

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setEditPrices(prev => ({ ...prev, [name]: value }));
        }
    };

    const cancelEdit = () => {
        setEditPrices({
            monthly_package: packagePrices.monthly_package,
            yearly_package: packagePrices.yearly_package
        });
        setIsEditing(false);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <Header
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />

            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                    
                    {/* Page Header with Gradient */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl"></div>
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Subscription Packages
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    Manage your monthly and yearly subscription packages
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-4 md:mt-0">
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                                    >
                                        <FiEdit2 size={16} />
                                        Edit Prices
                                    </button>
                                )}
                                <button
                                    onClick={fetchPackagePrices}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Alert Messages */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 animate-slideDown">
                            <FiXCircle size={20} className="flex-shrink-0" />
                            <span className="flex-1">{error}</span>
                            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
                                <FiXCircle size={16} />
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-300 animate-slideDown">
                            <FiCheckCircle size={20} className="flex-shrink-0" />
                            <span className="flex-1">{success}</span>
                            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
                                <FiXCircle size={16} />
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading packages...</p>
                        </div>
                    ) : (
                        <>
                            {/* Package Cards */}
                            <div className="mb-10">
                                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                    {/* Monthly Package Card */}
                                    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl"></div>
                                        
                                        <div className="relative p-8">
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">per project</p>
                                                </div>
                                                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                                                    <FiClock className="text-white" size={24} />
                                                </div>
                                            </div>
                                            
                                            {isEditing ? (
                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Price (₹)
                                                    </label>
                                                    <div className="relative">
                                                        <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            name="monthly_package"
                                                            value={editPrices.monthly_package}
                                                            onChange={handleEditChange}
                                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/30 outline-none transition-all text-lg font-semibold"
                                                            placeholder="Enter amount"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mb-6">
                                                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(packagePrices.monthly_package)}
                                                    </span>
                                                    <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">/month</span>
                                                </div>
                                            )}
                                            
                                            {!isEditing && (
                                                <>
                                                    <div className="w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md flex items-center justify-center gap-3">
                                                        <FiCheckCircle size={20} />
                                                        Monthly Package
                                                    </div>
                                                    
                                                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <FiZap size={16} className="text-purple-500" />
                                                        <span>Billed monthly • Cancel anytime</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Yearly Package Card */}
                                    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden">
                                        {/* Popular Badge */}
                                        <div className="absolute top-6 right-6 z-10">
                                            <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1">
                                                <FiAward size={16} />
                                                BEST VALUE
                                            </span>
                                        </div>
                                        
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-2xl"></div>
                                        
                                        <div className="relative p-8">
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Yearly</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">per project</p>
                                                </div>
                                                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-lg">
                                                    <FiTrendingUp className="text-white" size={24} />
                                                </div>
                                            </div>
                                            
                                            {isEditing ? (
                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Price (₹)
                                                    </label>
                                                    <div className="relative">
                                                        <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            name="yearly_package"
                                                            value={editPrices.yearly_package}
                                                            onChange={handleEditChange}
                                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900/30 outline-none transition-all text-lg font-semibold"
                                                            placeholder="Enter amount"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="mb-2">
                                                        <span className="text-5xl font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(packagePrices.yearly_package)}
                                                        </span>
                                                        <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">/year</span>
                                                    </div>
                                                    
                                                    {savings > 0 && (
                                                        <div className="mb-4 inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                            <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                                                Save {formatCurrency(savings)} ({savingsPercent}% OFF)
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            
                                            {!isEditing && (
                                                <>
                                                    <div className="w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md flex items-center justify-center gap-3">
                                                        <FiStar size={20} />
                                                        Yearly Package
                                                    </div>
                                                    
                                                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <FiPercent size={16} className="text-indigo-500" />
                                                        <span>Billed annually • Save {savingsPercent}%</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Actions */}
                                {isEditing && (
                                    <div className="flex items-center justify-center gap-4 mt-8">
                                        <button
                                            onClick={updatePackagePrices}
                                            disabled={updating}
                                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {updating ? (
                                                <>
                                                    <FiRefreshCw size={18} className="animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <FiSave size={18} />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            disabled={updating}
                                            className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Package Information Card */}
                            {!isEditing && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <FiPackage className="text-indigo-500" />
                                            Package Information
                                        </h3>
                                    </div>
                                    
                                    <div className="p-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                                <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                                                    <FiClock size={18} />
                                                    Monthly Plan Details
                                                </h4>
                                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <li className="flex items-center gap-2">
                                                        <FiCheckCircle className="text-green-500" size={14} />
                                                        Price: {formatCurrency(packagePrices.monthly_package)}/month
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <FiCheckCircle className="text-green-500" size={14} />
                                                        Billed monthly
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <FiCheckCircle className="text-green-500" size={14} />
                                                        Cancel anytime
                                                    </li>
                                                </ul>
                                            </div>
                                            
                                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                                <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                                    <FiTrendingUp size={18} />
                                                    Yearly Plan Details
                                                </h4>
                                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <li className="flex items-center gap-2">
                                                        <FiCheckCircle className="text-green-500" size={14} />
                                                        Price: {formatCurrency(packagePrices.yearly_package)}/year
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <FiCheckCircle className="text-green-500" size={14} />
                                                        Billed annually
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <FiCheckCircle className="text-green-500" size={14} />
                                                        Save {formatCurrency(savings)} per year
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        {/* Encryption Info */}
                                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <FiLock className="text-indigo-500" size={16} />
                                                <span>Data is encrypted before sending to ensure secure transmission</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default AllSubscriptions;