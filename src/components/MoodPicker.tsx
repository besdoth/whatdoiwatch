"use client";

const MOODS = [
  { id: "something funny and easy", label: "Funny & Easy", emoji: "😂" },
  { id: "dark and intense, keep me on edge", label: "Dark & Intense", emoji: "🖤" },
  { id: "comfort watch, something familiar and cozy", label: "Comfort Watch", emoji: "🛋️" },
  { id: "mind-bending or thought-provoking", label: "Mind-Bending", emoji: "🤯" },
  { id: "emotional, make me feel something real", label: "Emotional", emoji: "😢" },
  { id: "action-packed, high energy, exciting", label: "Action", emoji: "💥" },
  { id: "scary or creepy, horror vibes", label: "Horror", emoji: "👻" },
  { id: "something romantic or a love story", label: "Romance", emoji: "❤️" },
  { id: "custom", label: "Something else...", emoji: "✏️" },
];

interface Props {
  selected: string;
  onSelect: (mood: string) => void;
}

export default function MoodPicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {MOODS.map((mood) => {
        const isSelected = selected === mood.id;
        return (
          <button
            key={mood.id}
            onClick={() => onSelect(isSelected ? "" : mood.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              isSelected
                ? "bg-white text-black border-white"
                : "bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500 hover:text-white"
            }`}
          >
            <span>{mood.emoji}</span>
            <span>{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}
