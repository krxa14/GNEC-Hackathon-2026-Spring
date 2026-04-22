const translations = {
  en: {
    cardLabel: "Active checkoff card",
    courseLabel: "Antibiotic course",
    daysLabel: "Total days",
    dosesLabel: "Doses per day",
    instruction: "Mark each dose after you take it.",
    reminder: "Follow the pharmacist or clinician instructions for timing.",
    footerLeft: "Designed to be language-light and easy to localize.",
    footerRight: "Runs entirely in your browser. No patient data stored.",
    dayPrefix: "Day",
    slots: {
      morning: "Morning",
      midday: "Midday",
      evening: "Evening",
      bedtime: "Bedtime"
    }
  },
  es: {
    cardLabel: "Tarjeta activa de seguimiento",
    courseLabel: "Tratamiento antibiótico",
    daysLabel: "Días totales",
    dosesLabel: "Dosis por día",
    instruction: "Marque cada dosis después de tomarla.",
    reminder: "Siga las instrucciones del farmacéutico o del personal clínico.",
    footerLeft: "Diseñado para usar poco texto y facilitar la localización.",
    footerRight: "Funciona totalmente en su navegador. No guarda datos del paciente.",
    dayPrefix: "Día",
    slots: {
      morning: "Mañana",
      midday: "Mediodía",
      evening: "Noche",
      bedtime: "Antes de dormir"
    }
  },
  hi: {
    cardLabel: "सक्रिय चेकऑफ कार्ड",
    courseLabel: "एंटीबायोटिक कोर्स",
    daysLabel: "कुल दिन",
    dosesLabel: "रोज़ की खुराक",
    instruction: "हर खुराक लेने के बाद तुरंत निशान लगाएं।",
    reminder: "समय के लिए फार्मासिस्ट या क्लिनिशियन के निर्देश मानें।",
    footerLeft: "कम शब्दों वाला लेआउट, आसान स्थानीयकरण के लिए।",
    footerRight: "यह पूरी तरह आपके ब्राउज़र में चलता है। रोगी डेटा संग्रहीत नहीं होता।",
    dayPrefix: "दिन",
    slots: {
      morning: "सुबह",
      midday: "दोपहर",
      evening: "शाम",
      bedtime: "सोने से पहले"
    }
  }
};

const dosePatterns = {
  1: ["morning"],
  2: ["morning", "evening"],
  3: ["morning", "midday", "evening"],
  4: ["morning", "midday", "evening", "bedtime"]
};

const sunIcon = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="3"></circle>
    <g stroke="currentColor" stroke-width="3" stroke-linecap="round">
      <line x1="24" y1="4" x2="24" y2="12"></line>
      <line x1="24" y1="36" x2="24" y2="44"></line>
      <line x1="4" y1="24" x2="12" y2="24"></line>
      <line x1="36" y1="24" x2="44" y2="24"></line>
      <line x1="10" y1="10" x2="15" y2="15"></line>
      <line x1="33" y1="33" x2="38" y2="38"></line>
      <line x1="10" y1="38" x2="15" y2="33"></line>
      <line x1="33" y1="15" x2="38" y2="10"></line>
    </g>
  </svg>
`;

const moonIcon = `
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path
      d="M30 6c-8.8 2.5-14.4 11.5-12.8 20.7 1.6 9 10 15.5 19.1 14.7-3.3 2-7.2 3-11.4 2.5C13.8 42.5 6 33 7 22.1 8 11.5 17.2 3.8 27.7 4.6 28.5 4.6 29.3 5 30 6Z"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linejoin="round"
    ></path>
  </svg>
`;

const form = document.getElementById("doseguard-form");
const antibioticSelect = document.getElementById("antibiotic");
const customAntibioticField = document.getElementById("custom-antibiotic-field");
const customAntibioticInput = document.getElementById("custom-antibiotic");
const doseCard = document.getElementById("dose-card");
const printButton = document.getElementById("print-card");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveAntibioticName() {
  if (antibioticSelect.value === "custom") {
    const entered = customAntibioticInput.value.trim();
    return entered || "Antibiotic";
  }

  return antibioticSelect.value;
}

function toggleCustomField() {
  const isCustom = antibioticSelect.value === "custom";
  const wasHidden = customAntibioticField.classList.contains("is-hidden");
  customAntibioticField.classList.toggle("is-hidden", !isCustom);
  customAntibioticInput.toggleAttribute("required", isCustom);
  if (isCustom && wasHidden) {
    customAntibioticInput.focus();
  }
}

function applyPrintSizing(totalDays) {
  let rowHeight = "22mm";
  let boxSize = "11mm";
  if (totalDays > 21) {
    rowHeight = "7mm";
    boxSize = "5mm";
  } else if (totalDays > 14) {
    rowHeight = "9mm";
    boxSize = "6mm";
  } else if (totalDays > 10) {
    rowHeight = "14mm";
    boxSize = "9mm";
  } else if (totalDays > 7) {
    rowHeight = "18mm";
    boxSize = "10mm";
  }
  doseCard.style.setProperty("--print-row-height", rowHeight);
  doseCard.style.setProperty("--print-box-size", boxSize);
}

function getTimeSlots(dosesPerDay) {
  const keys = dosePatterns[dosesPerDay] || dosePatterns[2];
  return keys.map((key) => ({
    key,
    icon: key === "evening" || key === "bedtime" ? moonIcon : sunIcon
  }));
}

function renderCard() {
  const language = document.getElementById("language").value;
  const dictionary = translations[language] || translations.en;
  const antibiotic = escapeHtml(resolveAntibioticName());
  const dosesPerDay = Number(document.getElementById("doses-per-day").value);
  const totalDays = Math.min(
    30,
    Math.max(1, Number(document.getElementById("total-days").value) || 1)
  );
  const slots = getTimeSlots(dosesPerDay);

  doseCard.setAttribute("lang", language);
  applyPrintSizing(totalDays);

  const headCells = slots
    .map(
      (slot) => `
        <th scope="col" class="slot-head">
          <div class="slot-head-inner">
            <span class="slot-icon">${slot.icon}</span>
            <span class="slot-name">${escapeHtml(dictionary.slots[slot.key])}</span>
          </div>
        </th>
      `
    )
    .join("");

  const rows = Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const cells = slots
      .map(
        () => `
          <td class="check-cell">
            <div class="check-box" aria-hidden="true"></div>
          </td>
        `
      )
      .join("");

    return `
      <tr>
        <th scope="row" class="day-cell">${escapeHtml(dictionary.dayPrefix)} ${dayNumber}</th>
        ${cells}
      </tr>
    `;
  }).join("");

  doseCard.innerHTML = `
    <div class="dose-card-header">
      <div class="dose-card-title">
        <p class="eyebrow">${escapeHtml(dictionary.cardLabel)}</p>
        <h3>${antibiotic}</h3>
        <p class="footer-note">${escapeHtml(dictionary.instruction)}</p>
        <p class="muted-copy">${escapeHtml(dictionary.reminder)}</p>
      </div>
      <div class="dose-card-summary">
        <div class="summary-chip">
          <span>${escapeHtml(dictionary.daysLabel)}</span>
          <strong>${totalDays}</strong>
        </div>
        <div class="summary-chip">
          <span>${escapeHtml(dictionary.dosesLabel)}</span>
          <strong>${dosesPerDay}</strong>
        </div>
      </div>
    </div>

    <table class="dose-card-grid">
      <thead>
        <tr>
          <th scope="col" class="day-header">${escapeHtml(dictionary.courseLabel)}</th>
          ${headCells}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="dose-card-footer">
      <p>${escapeHtml(dictionary.footerLeft)}</p>
      <p>${escapeHtml(dictionary.footerRight)}</p>
    </div>
  `;
}

antibioticSelect.addEventListener("change", () => {
  toggleCustomField();
  renderCard();
});

customAntibioticInput.addEventListener("input", renderCard);
document.getElementById("language").addEventListener("change", renderCard);
document.getElementById("doses-per-day").addEventListener("change", renderCard);
document.getElementById("total-days").addEventListener("input", renderCard);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderCard();
});

printButton.addEventListener("click", () => {
  renderCard();
  window.print();
});

toggleCustomField();
renderCard();
