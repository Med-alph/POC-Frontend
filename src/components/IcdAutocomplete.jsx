import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, BookOpen } from 'lucide-react';
import clinicalCodingAPI from '../api/clinicalcodingapi';

const IcdAutocomplete = ({
    onSelect,
    placeholder = "Search ICD-10 diagnostic codes...",
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

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);

    const handleInputChange = (e) => {
        if (disabled) return;

        const newValue = e.target.value;
        setQuery(newValue);
        setSelectedIndex(-1);
        setShowDropdown(true);

        if (onChange) {
            onChange(newValue);
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchIcd(newValue);
        }, 300);
    };

    const searchIcd = async (searchTerm = "") => {
        if (!searchTerm || searchTerm.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await clinicalCodingAPI.searchIcd10(searchTerm);
            setSuggestions(response || []);
            setShowDropdown(true);
        } catch (error) {
            console.error('Error searching ICD codes:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (code) => {
        // We want to pass the selected code object back.
        // It has code, description, chapter, etc.
        setQuery("");
        setSuggestions([]);
        setShowDropdown(false);
        setSelectedIndex(-1);

        if (onSelect) {
            onSelect(code);
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
                        if (query.trim().length >= 2) {
                            setShowDropdown(true);
                            searchIcd(query);
                        }
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
                            if (!showDropdown && query.trim().length >= 2) searchIcd(query);
                        }
                    }}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                    ) : (
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    )}
                </div>
            </div>

            {showDropdown && query.trim().length >= 2 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-72 overflow-hidden flex flex-col animate-in fade-in duration-100"
                >
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            ICD-10-CM Standard Diagnostic Library
                        </span>
                    </div>

                    <div className="overflow-y-auto max-h-60">
                        {suggestions.length > 0 ? (
                            suggestions.map((item, index) => (
                                <div
                                    key={item.id || item.code}
                                    onClick={() => handleSelect(item)}
                                    className={`px-4 py-2.5 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${index === selectedIndex
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <BookOpen className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded leading-none">
                                                    {item.code}
                                                </span>
                                                {item.chapter && (
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        Chapter: {item.chapter}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium break-words leading-relaxed">
                                                {item.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : !loading && (
                            <div className="px-4 py-8 text-center">
                                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    No diagnosis found matching "{query}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default IcdAutocomplete;
