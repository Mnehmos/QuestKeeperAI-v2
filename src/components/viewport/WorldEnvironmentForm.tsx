import React, { useState, useEffect } from 'react';
import { useGameStateStore } from '../../stores/gameStateStore';
import { mcpManager } from '../../services/mcpClient';

interface EnvironmentFormData {
  date: string;
  timeOfDay: string;
  season: string;
  weatherConditions: string;
  temperature: string;
  lighting: string;
  moonPhase: string;
}

const TIME_OF_DAY_OPTIONS = [
  { value: 'dawn', label: 'Dawn' },
  { value: 'morning', label: 'Morning' },
  { value: 'noon', label: 'Noon' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
  { value: 'midnight', label: 'Midnight' },
];

const SEASON_OPTIONS = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
];

const WEATHER_OPTIONS = [
  { value: 'clear', label: 'Clear Skies' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'overcast', label: 'Overcast' },
  { value: 'light_rain', label: 'Light Rain' },
  { value: 'heavy_rain', label: 'Heavy Rain' },
  { value: 'thunderstorm', label: 'Thunderstorm' },
  { value: 'fog', label: 'Foggy' },
  { value: 'snow', label: 'Snow' },
  { value: 'blizzard', label: 'Blizzard' },
  { value: 'windy', label: 'Windy' },
];

const TEMPERATURE_OPTIONS = [
  { value: 'freezing', label: 'Freezing' },
  { value: 'cold', label: 'Cold' },
  { value: 'cool', label: 'Cool' },
  { value: 'mild', label: 'Mild' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
  { value: 'scorching', label: 'Scorching' },
];

const LIGHTING_OPTIONS = [
  { value: 'bright_daylight', label: 'Bright Daylight' },
  { value: 'dim_golden_light', label: 'Dim Golden Light' },
  { value: 'fading_orange_light', label: 'Fading Orange Light' },
  { value: 'moonlight', label: 'Moonlight' },
  { value: 'starlight', label: 'Starlight Only' },
  { value: 'pitch_black', label: 'Pitch Black' },
  { value: 'torchlight', label: 'Torchlight' },
  { value: 'candlelight', label: 'Candlelight' },
  { value: 'magical_glow', label: 'Magical Glow' },
  { value: 'dark_and_ominous', label: 'Dark and Ominous' },
];

const MOON_PHASE_OPTIONS = [
  { value: 'new_moon', label: 'New Moon' },
  { value: 'waxing_crescent', label: 'Waxing Crescent' },
  { value: 'first_quarter', label: 'First Quarter' },
  { value: 'waxing_gibbous', label: 'Waxing Gibbous' },
  { value: 'full_moon', label: 'Full Moon' },
  { value: 'waning_gibbous', label: 'Waning Gibbous' },
  { value: 'third_quarter', label: 'Third Quarter' },
  { value: 'waning_crescent', label: 'Waning Crescent' },
];

// Quick presets for common scenarios
const PRESETS = {
  dawn: {
    timeOfDay: 'dawn',
    lighting: 'dim_golden_light',
    temperature: 'cool',
  },
  noon: {
    timeOfDay: 'noon',
    lighting: 'bright_daylight',
    temperature: 'warm',
  },
  dusk: {
    timeOfDay: 'dusk',
    lighting: 'fading_orange_light',
    temperature: 'mild',
  },
  night: {
    timeOfDay: 'night',
    lighting: 'moonlight',
    moonPhase: 'full_moon',
    temperature: 'cool',
  },
  storm: {
    weatherConditions: 'thunderstorm',
    lighting: 'dark_and_ominous',
    temperature: 'cold',
  },
};

interface WorldEnvironmentFormProps {
  onClose?: () => void;
}

export const WorldEnvironmentForm: React.FC<WorldEnvironmentFormProps> = ({ onClose }) => {
  const activeWorldId = useGameStateStore((state) => state.activeWorldId);
  const world = useGameStateStore((state) => state.world);
  const syncState = useGameStateStore((state) => state.syncState);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<EnvironmentFormData>({
    date: '',
    timeOfDay: 'morning',
    season: 'spring',
    weatherConditions: 'clear',
    temperature: 'mild',
    lighting: 'bright_daylight',
    moonPhase: 'full_moon',
  });

  // Initialize form with current environment data
  useEffect(() => {
    if (world?.environment) {
      const env = world.environment;
      setFormData({
        date: typeof env.date === 'object' ? env.date.full_date || '' : env.date || '',
        timeOfDay: env.time_of_day || env.timeOfDay || 'morning',
        season: typeof env.season === 'object' ? env.season.current || 'spring' : env.season || 'spring',
        weatherConditions: typeof env.weather === 'object' ? env.weather.condition || 'clear' : env.weather || env.weatherConditions || 'clear',
        temperature: typeof env.temperature === 'object' ? env.temperature.current || 'mild' : env.temperature || 'mild',
        lighting: typeof env.lighting === 'object' ? env.lighting.overall || 'bright_daylight' : env.lighting || 'bright_daylight',
        moonPhase: typeof env.moon_phase === 'object' ? env.moon_phase.phase || 'full_moon' : env.moon_phase || env.moonPhase || 'full_moon',
      });
    }
  }, [world?.environment]);

  const handleChange = (field: keyof EnvironmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    const preset = PRESETS[presetName];
    setFormData(prev => ({ ...prev, ...preset }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeWorldId) {
      setMessage({ type: 'error', text: 'No active world selected' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Build environment object in the format expected by rpg-mcp
      const environment = {
        date: formData.date || undefined,
        time_of_day: formData.timeOfDay,
        season: formData.season,
        weather: formData.weatherConditions,
        temperature: formData.temperature,
        lighting: formData.lighting,
        moon_phase: formData.moonPhase,
      };

      await mcpManager.gameStateClient.callTool('update_world_environment', {
        worldId: activeWorldId,
        environment,
      });

      // Refresh state from server
      await syncState(true);

      setMessage({ type: 'success', text: 'Environment updated successfully!' });

      // Close form after short delay on success
      if (onClose) {
        setTimeout(onClose, 1500);
      }
    } catch (error: any) {
      console.error('[WorldEnvironmentForm] Failed to update environment:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update environment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectField = ({
    label,
    value,
    options,
    onChange,
    icon
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    icon?: string;
  }) => (
    <div className="mb-3">
      <label className="text-terminal-green/70 uppercase tracking-wider text-xs flex items-center gap-2 mb-1">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-terminal-black border border-terminal-green-dim text-terminal-green p-2 text-sm focus:outline-none focus:border-terminal-green"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="bg-terminal-black/90 border border-terminal-green p-4 rounded-sm">
      <h3 className="text-sm font-bold mb-4 border-b border-terminal-green pb-2 uppercase tracking-widest text-terminal-green-bright flex items-center gap-2">
        <span>🌤️</span>
        Set Environment
      </h3>

      {/* Quick Presets */}
      <div className="mb-4">
        <div className="text-terminal-green/70 uppercase tracking-wider text-xs mb-2">Quick Presets</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('dawn')}
            className="px-3 py-1 text-xs bg-terminal-green/10 border border-terminal-green-dim hover:bg-terminal-green/20 transition-colors"
          >
            🌅 Dawn
          </button>
          <button
            type="button"
            onClick={() => applyPreset('noon')}
            className="px-3 py-1 text-xs bg-terminal-green/10 border border-terminal-green-dim hover:bg-terminal-green/20 transition-colors"
          >
            ☀️ Noon
          </button>
          <button
            type="button"
            onClick={() => applyPreset('dusk')}
            className="px-3 py-1 text-xs bg-terminal-green/10 border border-terminal-green-dim hover:bg-terminal-green/20 transition-colors"
          >
            🌆 Dusk
          </button>
          <button
            type="button"
            onClick={() => applyPreset('night')}
            className="px-3 py-1 text-xs bg-terminal-green/10 border border-terminal-green-dim hover:bg-terminal-green/20 transition-colors"
          >
            🌙 Night
          </button>
          <button
            type="button"
            onClick={() => applyPreset('storm')}
            className="px-3 py-1 text-xs bg-terminal-green/10 border border-terminal-green-dim hover:bg-terminal-green/20 transition-colors"
          >
            ⛈️ Storm
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Date Input */}
        <div className="mb-3">
          <label className="text-terminal-green/70 uppercase tracking-wider text-xs flex items-center gap-2 mb-1">
            <span className="text-sm">📅</span>
            Date (optional)
          </label>
          <input
            type="text"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            placeholder="e.g., 15th of Midsummer, Year 1421"
            className="w-full bg-terminal-black border border-terminal-green-dim text-terminal-green p-2 text-sm focus:outline-none focus:border-terminal-green placeholder-terminal-green/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Time of Day"
            icon="🕒"
            value={formData.timeOfDay}
            options={TIME_OF_DAY_OPTIONS}
            onChange={(v) => handleChange('timeOfDay', v)}
          />
          <SelectField
            label="Season"
            icon="🍂"
            value={formData.season}
            options={SEASON_OPTIONS}
            onChange={(v) => handleChange('season', v)}
          />
          <SelectField
            label="Weather"
            icon="☁️"
            value={formData.weatherConditions}
            options={WEATHER_OPTIONS}
            onChange={(v) => handleChange('weatherConditions', v)}
          />
          <SelectField
            label="Temperature"
            icon="🌡️"
            value={formData.temperature}
            options={TEMPERATURE_OPTIONS}
            onChange={(v) => handleChange('temperature', v)}
          />
          <SelectField
            label="Lighting"
            icon="💡"
            value={formData.lighting}
            options={LIGHTING_OPTIONS}
            onChange={(v) => handleChange('lighting', v)}
          />
          <SelectField
            label="Moon Phase"
            icon="🌙"
            value={formData.moonPhase}
            options={MOON_PHASE_OPTIONS}
            onChange={(v) => handleChange('moonPhase', v)}
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-3 p-2 text-sm ${message.type === 'success' ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'} border`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !activeWorldId}
            className="flex-1 px-4 py-2 bg-terminal-green text-terminal-black font-bold uppercase text-sm hover:bg-terminal-green-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Apply Environment'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-terminal-green text-terminal-green font-bold uppercase text-sm hover:bg-terminal-green/10 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {!activeWorldId && (
          <div className="mt-2 text-xs text-yellow-500">
            No world selected. Please select a world first.
          </div>
        )}
      </form>
    </div>
  );
};
