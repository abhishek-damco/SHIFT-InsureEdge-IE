import { useState, useRef, useEffect } from 'react'
import { MapPin, AlertTriangle } from 'lucide-react'

// Mock Google Maps Places suggestions — in production this hits the Places API
const MOCK_SUGGESTIONS = [
  { address: '579 North Valley Parkway, San Jose, CA 95128', lat: 37.3382, lng: -121.8863 },
  { address: '55 Music Concourse Drive, San Francisco, CA 94118', lat: 37.7700, lng: -122.4668 },
  { address: '100 Main Street, New York, NY 10001', lat: 40.7128, lng: -74.0060 },
  { address: '221B Baker Street, London, UK W1U 6SG', lat: 51.5237, lng: -0.1585 },
  { address: '1600 Pennsylvania Avenue NW, Washington, DC 20500', lat: 38.8977, lng: -77.0365 },
]

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  mapsAvailable?: boolean
}

export default function AddressAutocomplete({
  value,
  onChange,
  mapsAvailable = true,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<typeof MOCK_SUGGESTIONS>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInput = (v: string) => {
    onChange(v)
    if (!mapsAvailable || v.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    // Simulate Places API debounce
    const matches = MOCK_SUGGESTIONS.filter(s =>
      s.address.toLowerCase().includes(v.toLowerCase())
    )
    setSuggestions(matches)
    setOpen(matches.length > 0)
  }

  const select = (s: typeof MOCK_SUGGESTIONS[0]) => {
    onChange(s.address)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="col-span-2 relative" ref={ref}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Street Address
        {mapsAvailable ? (
          <span className="ml-2 text-gray-400 font-normal text-xs">Powered by Google Maps</span>
        ) : (
          <span className="ml-2 inline-flex items-center gap-1 text-yellow-600 font-normal text-xs">
            <AlertTriangle size={11} /> Maps unavailable — manual entry
          </span>
        )}
      </label>
      <div className="relative">
        <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Start typing to search address..."
          className="input-field pl-8"
        />
      </div>
      {open && (
        <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded shadow-md mt-1">
          {suggestions.map(s => (
            <li
              key={s.address}
              onClick={() => select(s)}
              className="flex items-start gap-2 px-3 py-2.5 hover:bg-blue-50 cursor-pointer"
            >
              <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-700">{s.address}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
