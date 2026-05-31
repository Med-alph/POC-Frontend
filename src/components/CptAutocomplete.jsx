import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ClipboardList } from 'lucide-react';
import clinicalCodingAPI from '../api/clinicalcodingapi';

/**
 * CptAutocomplete — search CPT master and return the selected code object.
 * Used in AddProcedureDialog so admins can map a CPT code to a hospital procedure.
 *
 * Props:
 *   onSelect(cptObj)  — called with { code, description } when user picks a result
 *   value             — controlled display string (the code, e.g. "15788")
 *   onClear()         — called when the user clears the selection
 *   placeholder       — input placeholder text
 *   disabled          — disables the input
 *   className         — extra wrapper classes
 */
const CptAutocomplete = ({
    onSelect,
    value = "",
    onClear,
    placeholder = "Search CPT codes (e.g. '99213', 'office visit')...",
    disabled = false,
    className = "",
}) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);

    // Sync external value changes (e.g. when editing an existing procedure)
    useEffect(() => {
        setQuery(value);
    }, [value]);

    const handleInputChange = (e) => {
        if (disabled) return;
        const newValue = e.target.value;
        setQuery(newValue);
        setSelectedIndex(-1);
        setShowDropdown(true);

        // If user clears the field, notify parent
        if (!newValue && onClear) onClear();

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchCpt(newValue);
        }, 300);
    };

    const searchCpt = async (searchTerm = "") => {
        if (!searchTerm || searchTerm.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const response = await clinicalCodingAPI.searchCpt(searchTerm);
            setSuggestions(response || []);
            setShowDropdown(true);
        } catch (error) {
            console.error('Error searching CPT codes:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (cpt) => {
        setQuery(cpt.code);
        setSuggestions([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        if (onSelect) onSelect(cpt);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) handleSelect(suggestions[selectedIndex]);
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
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
                setSelectedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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
                            searchCpt(query);
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 text-sm ${
                        disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-indigo-600" />
                    ) : (
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    )}
                </div>
            </div>

            {showDropdown && query.trim().length >= 2 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-hidden flex flex-col animate-in fade-in duration-100"
                >
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            CPT Standard Procedure Library
                        </span>
                    </div>
                    <div className="overflow-y-auto max-h-52">
                        {suggestions.length > 0 ? (
                            suggestions.map((item, index) => (
                                <div
                                    key={item.code}
                                    onClick={() => handleSelect(item)}
                                    className={`px-4 py-2.5 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                        index === selectedIndex
                                            ? 'bg-indigo-50'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <ClipboardList className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded leading-none">
                                                    {item.code}
                                                </span>
                                                {item.category && (
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-700 mt-1 font-medium break-words leading-relaxed">
                                                {item.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : !loading && (
                            <div className="px-4 py-8 text-center">
                                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No CPT codes found for "{query}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CptAutocomplete;
