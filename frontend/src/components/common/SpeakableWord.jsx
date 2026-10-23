import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Volume2, Globe } from "lucide-react";

/**
 * Word component: Renders a single word with an adjacent clickable speaker icon (🔊).
 * Clicking the speaker speaks ONLY this specific word in the selected language.
 */
export const Word = ({ word, lang, className = "" }) => {
  const { language, speak } = useLanguage();
  const currentLang = lang || language;

  if (word === undefined || word === null) return null;
  const wordStr = String(word);

  if (!wordStr.trim()) {
    return <span>{wordStr}</span>;
  }

  const handleSpeak = (e) => {
    // Crucial: Prevent button clicks, form submissions, or link navigation
    e.preventDefault();
    e.stopPropagation();
    speak(wordStr, currentLang);
  };

  const accessibleLabel =
    currentLang === "hi"
      ? `"${wordStr}" शब्द सुनें`
      : `Listen to "${wordStr}"`;

  return (
    <span
      className={`speakable-word-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "normal",
        verticalAlign: "baseline",
      }}
    >
      <span className="speakable-word-text">{wordStr}</span>
      <button
        type="button"
        onClick={handleSpeak}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleSpeak(e);
          }
        }}
        className="word-speaker-btn"
        aria-label={accessibleLabel}
        title={accessibleLabel}
      >
        <Volume2 size={11} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </span>
  );
};

/**
 * SpeakableText component (also exported as T):
 * Translates the provided text into the active language and splits it into individual words,
 * equipping EVERY visible word with its own clickable speaker button.
 */
export const SpeakableText = ({
  children,
  text,
  lang,
  as: Component = "span",
  className = "",
  style = {},
}) => {
  const { t, language } = useLanguage();
  const currentLang = lang || language;

  // Resolve content: either text prop or string/number children
  let rawContent = text;
  if (rawContent === undefined && (typeof children === "string" || typeof children === "number")) {
    rawContent = String(children);
  }

  // If complex React children and no raw text string
  if (rawContent === undefined) {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        children: React.Children.map(children.props.children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return <SpeakableText text={String(child)} lang={currentLang} />;
          }
          return child;
        }),
      });
    }
    return <Component className={className} style={style}>{children}</Component>;
  }

  // Translate string
  const translated = t(rawContent, currentLang);
  const textStr = String(translated);

  // Split by whitespace while keeping tokens
  // e.g. "Farmer Dashboard" -> ["Farmer", " ", "Dashboard"]
  const tokens = textStr.split(/(\s+)/);

  return (
    <Component className={`speakable-text-wrap ${className}`} style={style}>
      {tokens.map((token, index) => {
        // If whitespace
        if (/^\s+$/.test(token)) {
          return <React.Fragment key={index}>{token}</React.Fragment>;
        }
        return <Word key={index} word={token} lang={currentLang} />;
      })}
    </Component>
  );
};

// Shorthand alias <T> for easy, ubiquitous use throughout templates
export const T = SpeakableText;

/**
 * LanguageSelector component:
 * Accessible toggle for switching between English (EN) and Hindi (हिंदी).
 */
export const LanguageSelector = ({ variant = "pill" }) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#f1f5f9",
        border: "1px solid #cbd5e1",
        borderRadius: "999px",
        padding: "3px 4px",
        gap: "2px",
      }}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        style={{
          background: language === "en" ? "#059669" : "transparent",
          color: language === "en" ? "#ffffff" : "#475569",
          border: "none",
          borderRadius: "999px",
          padding: "4px 10px",
          fontSize: "0.78rem",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
        title="Switch to English"
        aria-pressed={language === "en"}
      >
        <span>English</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage("hi")}
        style={{
          background: language === "hi" ? "#059669" : "transparent",
          color: language === "hi" ? "#ffffff" : "#475569",
          border: "none",
          borderRadius: "999px",
          padding: "4px 10px",
          fontSize: "0.78rem",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
        title="हिंदी में बदलें"
        aria-pressed={language === "hi"}
      >
        <span>हिंदी</span>
      </button>
    </div>
  );
};

export default SpeakableText;
