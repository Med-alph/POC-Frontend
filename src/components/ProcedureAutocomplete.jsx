import { useState, useEffect, useRef } from 'react';
import { Search, Activity, ChevronDown, ClipboardList, Globe, Filter } from 'lucide-react';
import proceduresAPI from '../api/proceduresapi';
import { useSelector } from 'react-redux';

const ProcedureAutocomplete = ({
    hospitalId,
    onSelect,
    placeholder = "Search procedures...",
    value = "",
    onChange,
    className = "",
    disabled = false
}) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isGlobal, setIsGlobal] = useState(false);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);
    const user = useSelector((state) => state.auth.user);
    const doctorDept = user?.department;

    const handleInputChange = (e) => {
        if (disabled) return;

        const newValue = e.target.value;
        setQuery(newValue);
        setSelectedIndex(-1);
        setShowDropdown(true);

        if (onChange) {
            onChange(newValue);
        }

        debounceRef.current = setTimeout(() => {
            searchProcedures(newValue, isGlobal);
        }, 300);
    };

    const toggleGlobal = () => {
        const nextGlobal = !isGlobal;
        setIsGlobal(nextGlobal);
        searchProcedures(query, nextGlobal);
    };

    const searchProcedures = async (searchTerm = "", useGlobal = false) => {
        if (!hospitalId) return;

        setLoading(true);
        try {
            const deptFilter = useGlobal ? null : doctorDept;
            const response = await proceduresAPI.search(hospitalId, searchTerm, deptFilter);

            setSuggestions(response || []);
            setShowDropdown(true);
        } catch (error) {
            console.error('Error searching procedures:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (procedure) => {
        setQuery(procedure.name);
        setSuggestions([]);
        setShowDropdown(false);
        setSelectedIndex(-1);

        if (onSelect) {
            onSelect(procedure);
        }
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !inputRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setShowDropdown(true);
                        searchProcedures(query, isGlobal);
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                    autoComplete="off"
                />
                <div
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 cursor-pointer"
                    onClick={() => {
                        if (!disabled) {
                            setShowDropdown(!showDropdown);
                            if (!showDropdown) searchProcedures(query);
                        }
                    }}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleGlobal();
                                }}
                                title={isGlobal ? "Switch to Department Search" : "Switch to Global Search"}
                                className={`p-1 rounded-md transition-colors ${isGlobal ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'}`}
                            >
                                {isGlobal ? <Globe className="h-4 w-4" /> : <Filter className="h-3 w-3" />}
                            </button>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                </div>
            </div>

            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-72 overflow-hidden flex flex-col"
                >
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            {isGlobal ? "Global Procedure List" : `${doctorDept || 'Department'} Procedures`}
                        </span>
                        {isGlobal && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">GLOBAL ACTIVE</span>
                        )}
                    </div>

                    <div className="overflow-y-auto max-h-60">
                        {suggestions.length > 0 ? (
                            suggestions.map((procedure, index) => (
                                <div
                                    key={procedure.id}
                                    onClick={() => handleSelect(procedure)}
                                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${index === selectedIndex
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Activity className={`h-4 w-4 ${procedure.department_id === 'General' ? 'text-gray-400' : 'text-blue-500'}`} />
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {procedure.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {procedure.category} • {procedure.department_id || 'General'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            ₹{procedure.price}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : !loading && (
                            <div className="px-4 py-8 text-center">
                                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    {query.length > 0 ? `No procedures found for "${query}"` : "Search to see procedures"}
                                </p>
                                {!isGlobal && (
                                    <button
                                        type="button"
                                        onClick={toggleGlobal}
                                        className="text-xs text-blue-600 font-medium hover:underline mt-2"
                                    >
                                        Search across all departments
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcedureAutocomplete;
