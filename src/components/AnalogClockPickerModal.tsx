import React, { useState, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';

interface AnalogClockPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTime: string; // e.g. "11:30 AM" or "02:15 PM"
  onSelectTime: (time12Str: string) => void;
}

export const AnalogClockPickerModal: React.FC<AnalogClockPickerModalProps> = ({
  isOpen,
  onClose,
  initialTime,
  onSelectTime
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(11);
  const [selectedMinute, setSelectedMinute] = useState<number>(30);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [pickerMode, setPickerMode] = useState<'hours' | 'minutes'>('hours');

  useEffect(() => {
    if (initialTime) {
      const match = initialTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        let h = parseInt(match[1], 10);
        if (h === 0) h = 12;
        if (h > 12) h = h % 12;
        const m = parseInt(match[2], 10);
        const period = match[3].toUpperCase() as 'AM' | 'PM';
        setSelectedHour(h);
        setSelectedMinute(m);
        setAmpm(period);
      }
    }
  }, [initialTime, isOpen]);

  if (!isOpen) return null;

  const handleHourClick = (h: number) => {
    setSelectedHour(h);
    // Auto switch to minutes selection for smooth UX
    setPickerMode('minutes');
  };

  const handleMinuteClick = (m: number) => {
    setSelectedMinute(m);
  };

  const handleConfirm = () => {
    const formattedHour = String(selectedHour).padStart(2, '0');
    const formattedMinute = String(selectedMinute).padStart(2, '0');
    onSelectTime(`${formattedHour}:${formattedMinute} ${ampm}`);
    onClose();
  };

  // Clock Hand angles
  const hourAngle = ((selectedHour % 12) * 30) + (selectedMinute * 0.5);
  const minuteAngle = selectedMinute * 6;

  // Geometry
  const size = 260;
  const center = size / 2;
  const radius = 95;

  const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: '#161616',
        border: '2px solid var(--accent-gold, #D4AF37)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '380px',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--accent-gold, #D4AF37)" /> Analog Clock Picker
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Digital Time Display & AM/PM Toggle */}
        <div style={{
          background: '#0d0d0d',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '14px 20px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          {/* Time digits */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '32px', fontWeight: 800 }}>
            <span
              onClick={() => setPickerMode('hours')}
              style={{
                color: pickerMode === 'hours' ? 'var(--accent-gold, #D4AF37)' : '#fff',
                cursor: 'pointer',
                borderBottom: pickerMode === 'hours' ? '2px solid var(--accent-gold, #D4AF37)' : '2px solid transparent',
                padding: '0 4px'
              }}
            >
              {String(selectedHour).padStart(2, '0')}
            </span>
            <span style={{ color: '#666' }}>:</span>
            <span
              onClick={() => setPickerMode('minutes')}
              style={{
                color: pickerMode === 'minutes' ? 'var(--accent-gold, #D4AF37)' : '#fff',
                cursor: 'pointer',
                borderBottom: pickerMode === 'minutes' ? '2px solid var(--accent-gold, #D4AF37)' : '2px solid transparent',
                padding: '0 4px'
              }}
            >
              {String(selectedMinute).padStart(2, '0')}
            </span>
          </div>

          {/* AM / PM Toggle buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setAmpm('AM')}
              style={{
                background: ampm === 'AM' ? 'var(--accent-gold, #D4AF37)' : '#222',
                color: ampm === 'AM' ? '#000' : '#888',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setAmpm('PM')}
              style={{
                background: ampm === 'PM' ? 'var(--accent-gold, #D4AF37)' : '#222',
                color: ampm === 'PM' ? '#000' : '#888',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              PM
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setPickerMode('hours')}
            style={{
              flex: 1,
              background: pickerMode === 'hours' ? '#2a2415' : '#1e1e1e',
              color: pickerMode === 'hours' ? 'var(--accent-gold, #D4AF37)' : '#888',
              border: pickerMode === 'hours' ? '1px solid var(--accent-gold, #D4AF37)' : '1px solid #333',
              padding: '8px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Select Hour
          </button>
          <button
            type="button"
            onClick={() => setPickerMode('minutes')}
            style={{
              flex: 1,
              background: pickerMode === 'minutes' ? '#2a2415' : '#1e1e1e',
              color: pickerMode === 'minutes' ? 'var(--accent-gold, #D4AF37)' : '#888',
              border: pickerMode === 'minutes' ? '1px solid var(--accent-gold, #D4AF37)' : '1px solid #333',
              padding: '8px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Select Minute
          </button>
        </div>

        {/* ANALOG CLOCK FACE */}
        <div style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #222 0%, #111 100%)',
          border: '4px solid #333',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.5)',
          marginBottom: '20px'
        }}>
          {/* SVG Clock Hands */}
          <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 5 }}>
            {/* Center Pivot */}
            <circle cx={center} cy={center} r={7} fill="var(--accent-gold, #D4AF37)" />

            {/* Hour Hand */}
            <line
              x1={center}
              y1={center}
              x2={center + 50 * Math.cos((hourAngle - 90) * (Math.PI / 180))}
              y2={center + 50 * Math.sin((hourAngle - 90) * (Math.PI / 180))}
              stroke="var(--accent-gold, #D4AF37)"
              strokeWidth={5}
              strokeLinecap="round"
            />

            {/* Minute Hand */}
            <line
              x1={center}
              y1={center}
              x2={center + 75 * Math.cos((minuteAngle - 90) * (Math.PI / 180))}
              y2={center + 75 * Math.sin((minuteAngle - 90) * (Math.PI / 180))}
              stroke="#3b82f6"
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Selected point indicator circle */}
            {pickerMode === 'hours' && (
              <circle
                cx={center + radius * Math.cos((((selectedHour % 12) * 30) - 90) * (Math.PI / 180))}
                cy={center + radius * Math.sin((((selectedHour % 12) * 30) - 90) * (Math.PI / 180))}
                r={16}
                fill="rgba(212, 175, 55, 0.3)"
                stroke="var(--accent-gold, #D4AF37)"
                strokeWidth={2}
              />
            )}

            {pickerMode === 'minutes' && (
              <circle
                cx={center + radius * Math.cos(((selectedMinute * 6) - 90) * (Math.PI / 180))}
                cy={center + radius * Math.sin(((selectedMinute * 6) - 90) * (Math.PI / 180))}
                r={16}
                fill="rgba(59, 130, 246, 0.3)"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            )}
          </svg>

          {/* Clock Numbers */}
          {pickerMode === 'hours' ? (
            HOURS.map(h => {
              const angle = ((h % 12) * 30 - 90) * (Math.PI / 180);
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              const isSelected = selectedHour === h || (h === 12 && selectedHour === 0);

              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourClick(h)}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isSelected ? 'var(--accent-gold, #D4AF37)' : 'transparent',
                    color: isSelected ? '#000' : '#ddd',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  {h}
                </button>
              );
            })
          ) : (
            MINUTES.map(m => {
              const angle = (m * 6 - 90) * (Math.PI / 180);
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              const isSelected = selectedMinute === m;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinuteClick(m)}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isSelected ? '#3b82f6' : 'transparent',
                    color: isSelected ? '#fff' : '#ddd',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  {String(m).padStart(2, '0')}
                </button>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: '#222',
              color: '#aaa',
              border: '1px solid #444',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 2,
              background: 'var(--accent-gold, #D4AF37)',
              color: '#000',
              border: 'none',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={16} /> Set Appointment Time
          </button>
        </div>
      </div>
    </div>
  );
};
