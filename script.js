/* =========================================================================
   1. NAVIGATION HEADER & MOBILE MENU
   ========================================================================= */
const header = document.getElementById('header');
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Scroll Effect for sticky header
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Mobile Hamburger toggle
menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Auto-close menu when clicking a link
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
  });
});


/* =========================================================================
   2. DYNAMIC NETWORK BACKGROUND CANVAS
   ========================================================================= */
const bgCanvas = document.getElementById('canvas-bg');
const bgCtx = bgCanvas.getContext('2d');

let particles = [];
let particleCount = 60;
const connectionDistance = 120;

class Particle {
  constructor() {
    this.x = Math.random() * bgCanvas.width;
    this.y = Math.random() * bgCanvas.height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.radius = Math.random() * 2 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Boundary check
    if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;
  }

  draw() {
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    bgCtx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    bgCtx.fill();
  }
}

function initBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function animateBgCanvas() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  
  // Render & connect particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
    
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < connectionDistance) {
        bgCtx.beginPath();
        bgCtx.moveTo(particles[i].x, particles[i].y);
        bgCtx.lineTo(particles[j].x, particles[j].y);
        const opacity = (1 - distance / connectionDistance) * 0.15;
        bgCtx.strokeStyle = `rgba(129, 140, 248, ${opacity})`;
        bgCtx.lineWidth = 1;
        bgCtx.stroke();
      }
    }
  }
  
  requestAnimationFrame(animateBgCanvas);
}

// Init and resize event
window.addEventListener('resize', initBgCanvas);
initBgCanvas();
animateBgCanvas();


/* =========================================================================
   3. INTERACTIVE MONTE CARLO PI ESTIMATION SIMULATOR
   ========================================================================= */
const simCanvas = document.getElementById('simulation-canvas');
const simCtx = simCanvas.getContext('2d');

const runSimBtn = document.getElementById('run-sim');
const resetSimBtn = document.getElementById('reset-sim');
const sampleSizeSelect = document.getElementById('sample-size');
const simSpeedSelect = document.getElementById('sim-speed');

const outInside = document.getElementById('out-inside');
const outTotal = document.getElementById('out-total');
const outPi = document.getElementById('out-pi');
const outError = document.getElementById('out-error');
const simStatus = document.getElementById('sim-status');

const canvasSize = 600;
const centerX = canvasSize / 2;
const centerY = canvasSize / 2;
const radius = canvasSize / 2 - 5; // offset slightly for borders

let totalPointsTarget = 1000;
let pointsPlotted = 0;
let pointsInside = 0;
let simulationId = null;
let isSimulating = false;

// Draw basic shape outline
function drawBaseGrid() {
  simCtx.clearRect(0, 0, canvasSize, canvasSize);
  
  // Outer Box Border
  simCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  simCtx.lineWidth = 2;
  simCtx.strokeRect(5, 5, canvasSize - 10, canvasSize - 10);
  
  // Circular target line
  simCtx.beginPath();
  simCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  simCtx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  simCtx.stroke();
}

function updateSimulationMetrics() {
  outInside.textContent = pointsInside.toLocaleString();
  outTotal.textContent = pointsPlotted.toLocaleString();
  
  if (pointsPlotted > 0) {
    const estimatedPi = 4 * (pointsInside / pointsPlotted);
    outPi.textContent = estimatedPi.toFixed(5);
    
    const absError = Math.abs((estimatedPi - Math.PI) / Math.PI) * 100;
    outError.textContent = absError.toFixed(3) + '%';
  } else {
    outPi.textContent = '0.00000';
    outError.textContent = '0.00%';
  }
}

// Generate single random coordinate inside the grid
function simulateSinglePoint() {
  // Random point within [centerX - radius, centerX + radius]
  const ptX = (Math.random() * (radius * 2)) + (centerX - radius);
  const ptY = (Math.random() * (radius * 2)) + (centerY - radius);
  
  // Calculate distance from center
  const dx = ptX - centerX;
  const dy = ptY - centerY;
  const distSquared = dx * dx + dy * dy;
  const isInside = distSquared <= radius * radius;
  
  pointsPlotted++;
  if (isInside) {
    pointsInside++;
  }
  
  // Plot the point
  simCtx.beginPath();
  simCtx.arc(ptX, ptY, 1.8, 0, Math.PI * 2);
  
  if (isInside) {
    simCtx.fillStyle = 'rgba(45, 212, 191, 0.85)'; // teal
  } else {
    simCtx.fillStyle = 'rgba(129, 140, 248, 0.55)'; // indigo/violet
  }
  simCtx.fill();
}

// Frame loop for animated rendering
function runSimulationLoop() {
  if (!isSimulating) return;
  
  // Add multiple points per frame to speed up higher count renders
  const pointsPerFrame = totalPointsTarget >= 5000 ? 40 : 15;
  
  for (let i = 0; i < pointsPerFrame; i++) {
    if (pointsPlotted < totalPointsTarget) {
      simulateSinglePoint();
    } else {
      endSimulation();
      break;
    }
  }
  
  updateSimulationMetrics();
  
  if (pointsPlotted < totalPointsTarget) {
    simulationId = requestAnimationFrame(runSimulationLoop);
  }
}

function runInstantSimulation() {
  drawBaseGrid();
  
  // Instant calculations using a single non-blocking chunking pattern or direct execution loop
  for (let i = 0; i < totalPointsTarget; i++) {
    simulateSinglePoint();
  }
  
  updateSimulationMetrics();
  endSimulation();
}

function startSimulation() {
  if (isSimulating) return;
  
  isSimulating = true;
  runSimBtn.disabled = true;
  sampleSizeSelect.disabled = true;
  simSpeedSelect.disabled = true;
  simStatus.textContent = 'RUNNING';
  simStatus.style.color = 'var(--accent-teal)';
  
  totalPointsTarget = parseInt(sampleSizeSelect.value);
  
  // If we had a previous run, clear details first
  if (pointsPlotted >= totalPointsTarget || pointsPlotted > 0) {
    pointsPlotted = 0;
    pointsInside = 0;
    drawBaseGrid();
  }
  
  const executionMethod = simSpeedSelect.value;
  if (executionMethod === 'instant') {
    runInstantSimulation();
  } else {
    runSimulationLoop();
  }
}

function endSimulation() {
  isSimulating = false;
  runSimBtn.disabled = false;
  sampleSizeSelect.disabled = false;
  simSpeedSelect.disabled = false;
  simStatus.textContent = 'COMPLETED';
  simStatus.style.color = 'var(--accent-cyan)';
}

function resetSimulation() {
  isSimulating = false;
  if (simulationId) {
    cancelAnimationFrame(simulationId);
  }
  
  pointsPlotted = 0;
  pointsInside = 0;
  
  runSimBtn.disabled = false;
  sampleSizeSelect.disabled = false;
  simSpeedSelect.disabled = false;
  
  simStatus.textContent = 'IDLE';
  simStatus.style.color = 'var(--text-muted)';
  
  drawBaseGrid();
  updateSimulationMetrics();
}

// Bind Simulator Events
runSimBtn.addEventListener('click', startSimulation);
resetSimBtn.addEventListener('click', resetSimulation);

// Initialize Simulator visual grid
drawBaseGrid();
updateSimulationMetrics();


/* =========================================================================
   4. ACTIVE NAVIGATION LINK ON SCROLL (INTERSECTION OBSERVER)
   ========================================================================= */
const sections = document.querySelectorAll('section');
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.3
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const activeId = entry.target.getAttribute('id');
      
      // Update nav link classes
      navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${activeId}`) {
          link.classList.add('active');
          // Update styling
          link.style.color = 'var(--accent-cyan)';
        } else {
          link.classList.remove('active');
          link.style.color = '';
        }
      });
    }
  });
}, observerOptions);

sections.forEach(section => observer.observe(section));


/* =========================================================================
   5. LAB AESTHETIC CONTROLS IMPLEMENTATION
   ========================================================================= */
const themeColorSelect = document.getElementById('theme-color');
const particleDensityInput = document.getElementById('particle-density');
const toggleGlowCheckbox = document.getElementById('toggle-glow');
const glowContainer = document.querySelector('.bg-glow-container');

// Theme Accent mappings
const themeColorsMap = {
  cyan: {
    '--accent-cyan': '#38bdf8',
    '--accent-teal': '#2dd4bf',
    '--accent-indigo': '#818cf8',
    '--accent-purple': '#c084fc'
  },
  purple: {
    '--accent-cyan': '#c084fc',
    '--accent-teal': '#f472b6',
    '--accent-indigo': '#a78bfa',
    '--accent-purple': '#818cf8'
  },
  emerald: {
    '--accent-cyan': '#10b981',
    '--accent-teal': '#6ee7b7',
    '--accent-indigo': '#059669',
    '--accent-purple': '#34d399'
  },
  indigo: {
    '--accent-cyan': '#818cf8',
    '--accent-teal': '#6366f1',
    '--accent-indigo': '#4f46e5',
    '--accent-purple': '#c084fc'
  }
};

// Update CSS Accent Variables
themeColorSelect.addEventListener('change', () => {
  const chosenColor = themeColorSelect.value;
  const colorSet = themeColorsMap[chosenColor];
  
  if (colorSet) {
    Object.keys(colorSet).forEach(key => {
      document.documentElement.style.setProperty(key, colorSet[key]);
    });
  }
  
  // Re-draw simulator grids with new colors
  drawBaseGrid();
  // Update floating nodes colors by re-initializing canvas particles
  initBgCanvas();
});

// Update Particle Counts dynamically
particleDensityInput.addEventListener('input', () => {
  particleCount = parseInt(particleDensityInput.value);
  initBgCanvas();
});

// Toggle Background glow visibility
toggleGlowCheckbox.addEventListener('change', () => {
  if (toggleGlowCheckbox.checked) {
    glowContainer.style.display = 'block';
  } else {
    glowContainer.style.display = 'none';
  }
});


/* =========================================================================
   6. PROJECT DETAIL MODALS DATA & HANDLERS
   ========================================================================= */
const projectDetails = {
  r: {
    title: "Building Statistical Models in R: Linear Regression",
    subtitle: "Language: R | Focus: Linear Modeling & Diagnostics",
    description: "Conducted exploratory data analysis (EDA) and built robust linear regression models on housing and spatial data. Checked standard statistical assumptions using diagnostic plots (Residuals vs Fitted, Normal Q-Q, Scale-Location, and Cook's distance) and assessed collinearity using Variance Inflation Factors (VIF).",
    codeHeader: "linear_regression.R",
    code: `# Load core libraries
library(ggplot2)
library(dplyr)
library(car) # for VIF checking

# Ingest and check data summary
data <- read.csv("housing_data.csv")
summary(data)

# Fit multiple linear regression model
model <- lm(price ~ sqft_living + bedrooms + bathrooms + age_years, data = data)
print(summary(model))

# Verify assumptions: Check Collinearity
vif(model)

# Generate Diagnostic Plots
par(mfrow = c(2, 2))
plot(model)`,
    chartHtml: `
      <div class="modal-chart-title" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem; text-align: center;">Fitted Regression Model (Visual Representation)</div>
      <svg width="450" height="220" viewBox="0 0 450 220">
        <!-- Axes -->
        <line x1="40" y1="180" x2="420" y2="180" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        <line x1="40" y1="20" x2="40" y2="180" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        
        <!-- Gridlines -->
        <line x1="40" y1="140" x2="420" y2="140" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
        <line x1="40" y1="100" x2="420" y2="100" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
        <line x1="40" y1="60" x2="420" y2="60" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
        
        <!-- Random Scatter Points -->
        <circle cx="70" cy="155" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="100" cy="142" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="130" cy="120" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="160" cy="130" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="190" cy="102" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="220" cy="85" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="250" cy="98" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="280" cy="72" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="310" cy="55" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="340" cy="62" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="370" cy="40" r="4" fill="rgba(129, 140, 248, 0.6)"/>
        <circle cx="400" cy="35" r="4" fill="rgba(129, 140, 248, 0.6)"/>

        <!-- Outliers -->
        <circle cx="180" cy="45" r="4" fill="rgba(239, 68, 68, 0.7)"/>
        <text x="180" y="35" fill="rgba(239, 68, 68, 0.9)" font-size="8" font-family="monospace">Outlier [Cook's D > 1.0]</text>
        
        <!-- Fitted Line -->
        <line x1="50" y1="170" x2="410" y2="30" stroke="var(--accent-cyan)" stroke-width="3"/>
        
        <!-- Labels -->
        <text x="230" y="200" fill="var(--text-secondary)" font-size="10" font-family="sans-serif" text-anchor="middle">Independent Variable (Sqft Living)</text>
        <text x="15" y="100" fill="var(--text-secondary)" font-size="10" font-family="sans-serif" text-anchor="middle" transform="rotate(-90 15 100)">Price (USD)</text>
      </svg>
    `,
    tableHtml: `
      <div class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>Coefficients</th>
              <th>Estimate</th>
              <th>Std. Error</th>
              <th>t value</th>
              <th>Pr(>|t|)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>(Intercept)</td>
              <td>124,531.2</td>
              <td>14,321.4</td>
              <td>8.69</td>
              <td>&lt; 2e-16 ***</td>
            </tr>
            <tr>
              <td>sqft_living</td>
              <td>245.8</td>
              <td>12.4</td>
              <td>19.82</td>
              <td>&lt; 2e-16 ***</td>
            </tr>
            <tr>
              <td>bedrooms</td>
              <td>-14,302.5</td>
              <td>3,105.1</td>
              <td>-4.61</td>
              <td>0.00012 **</td>
            </tr>
            <tr>
              <td>bathrooms</td>
              <td>22,410.8</td>
              <td>4,212.9</td>
              <td>5.32</td>
              <td>1.8e-06 ***</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); text-align: right; margin-top: 0.5rem;">Residual standard error: 42,400 on 452 degrees of freedom. Multiple R-squared: 0.812</div>
    `
  },
  python: {
    title: "Exploring & Analyzing FIFA's Datasets Using Python",
    subtitle: "Language: Python | Libraries: Pandas, NumPy, Seaborn, Matplotlib",
    description: "Loaded and cleaned raw FIFA player profiles, handling missing fields, parsing currency symbols, and extracting suffixes (M, K) to create normalized numeric columns. Conducted feature engineering and aggregated club data to locate average values and age ranges.",
    codeHeader: "fifa_tidy_analytics.py",
    code: `import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# Ingest dataset
df = pd.read_csv("fifa_raw_players.csv")

# Clean currency and value strings (e.g. €12.5M -> 12500000)
def parse_value(val_str):
    if not isinstance(val_str, str): return np.nan
    val_str = val_str.replace('€', '')
    if 'M' in val_str:
        return float(val_str.replace('M', '')) * 1e6
    elif 'K' in val_str:
        return float(val_str.replace('K', '')) * 1e3
    return float(val_str)

df['Value_EUR'] = df['Value'].apply(parse_value)

# Feature engineering: Bin ages
bins = [15, 20, 25, 30, 35, 50]
labels = ['Under 20', '20-25', '26-30', '31-35', 'Over 35']
df['AgeGroup'] = pd.cut(df['Age'], bins=bins, labels=labels)

# Aggregate Average Player Value by Top Clubs
top_clubs_value = df.groupby('Club')['Value_EUR'].mean().sort_values(ascending=False).head(10)
print(top_clubs_value)`,
    chartHtml: `
      <div class="modal-chart-title" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem; text-align: center;">Average Club Player Valuation (Top 5)</div>
      <svg width="450" height="200" viewBox="0 0 450 200">
        <!-- Bars -->
        <rect x="120" y="20" width="280" height="20" rx="3" fill="rgba(45, 212, 191, 0.8)"/>
        <text x="15" y="34" fill="var(--text-primary)" font-size="10" font-family="monospace">FC Barcelona</text>
        <text x="360" y="34" fill="#080C14" font-size="9" font-weight="bold" font-family="sans-serif">€42.4M</text>
        
        <rect x="120" y="55" width="265" height="20" rx="3" fill="rgba(45, 212, 191, 0.65)"/>
        <text x="15" y="69" fill="var(--text-primary)" font-size="10" font-family="monospace">Real Madrid</text>
        <text x="345" y="69" fill="#080C14" font-size="9" font-weight="bold" font-family="sans-serif">€40.1M</text>
        
        <rect x="120" y="90" width="240" height="20" rx="3" fill="rgba(56, 189, 248, 0.7)"/>
        <text x="15" y="104" fill="var(--text-primary)" font-size="10" font-family="monospace">Juventus</text>
        <text x="320" y="104" fill="#080C14" font-size="9" font-weight="bold" font-family="sans-serif">€36.8M</text>
        
        <rect x="120" y="125" width="230" height="20" rx="3" fill="rgba(129, 140, 248, 0.65)"/>
        <text x="15" y="139" fill="var(--text-primary)" font-size="10" font-family="monospace">Manchester City</text>
        <text x="310" y="139" fill="#080C14" font-size="9" font-weight="bold" font-family="sans-serif">€34.5M</text>
        
        <rect x="120" y="160" width="215" height="20" rx="3" fill="rgba(129, 140, 248, 0.5)"/>
        <text x="15" y="174" fill="var(--text-primary)" font-size="10" font-family="monospace">Paris SG</text>
        <text x="295" y="174" fill="#080C14" font-size="9" font-weight="bold" font-family="sans-serif">€32.0M</text>
        
        <!-- Scale -->
        <line x1="120" y1="190" x2="400" y2="190" stroke="rgba(255,255,255,0.15)"/>
        <text x="120" y="199" fill="var(--text-muted)" font-size="8" text-anchor="middle">€0</text>
        <text x="260" y="199" fill="var(--text-muted)" font-size="8" text-anchor="middle">€25M</text>
        <text x="400" y="199" fill="var(--text-muted)" font-size="8" text-anchor="middle">€50M</text>
      </svg>
    `,
    tableHtml: `
      <div class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Age</th>
              <th>Overall</th>
              <th>Club</th>
              <th>Value (EUR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>L. Messi</td>
              <td>32</td>
              <td>94</td>
              <td>FC Barcelona</td>
              <td>€95,500,000</td>
            </tr>
            <tr>
              <td>Cristiano Ronaldo</td>
              <td>34</td>
              <td>93</td>
              <td>Juventus</td>
              <td>€58,500,000</td>
            </tr>
            <tr>
              <td>Neymar Jr</td>
              <td>27</td>
              <td>92</td>
              <td>Paris Saint-Germain</td>
              <td>€105,500,000</td>
            </tr>
            <tr>
              <td>K. De Bruyne</td>
              <td>28</td>
              <td>91</td>
              <td>Manchester City</td>
              <td>€90,000,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  },
  mysql: {
    title: "Data Manipulation & CRM Management (MySQL Workbench)",
    subtitle: "Tool: MySQL Workbench | Focus: relational queries & schemas",
    description: "Designed database schemas for Customer Relationship Management (CRM) in a healthcare setting. Managed keys, indices, and created queries using subqueries, aggregation, and joins to locate high-cost demographic groups and audit patient profiles.",
    codeHeader: "crm_queries.sql",
    code: `-- Find top billing demographics in healthcare records
SELECT 
    p.demographic_group,
    COUNT(p.patient_id) AS patient_count,
    ROUND(SUM(b.billing_amount), 2) AS total_billing,
    ROUND(AVG(b.billing_amount), 2) AS average_per_patient
FROM patients p
JOIN medical_records r ON p.patient_id = r.patient_id
JOIN billing_details b ON r.record_id = b.record_id
WHERE b.payment_status = 'PAID'
GROUP BY p.demographic_group
HAVING total_billing > 50000
ORDER BY total_billing DESC;`,
    chartHtml: `
      <div class="modal-chart-title" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1.5rem; text-align: center;">CRM Database Schema Relations (ER Diagram)</div>
      <svg width="450" height="180" viewBox="0 0 450 180">
        <!-- Patients Table Card -->
        <rect x="20" y="20" width="120" height="120" rx="8" fill="rgba(23, 32, 51, 0.7)" stroke="var(--accent-cyan)" stroke-width="1.5"/>
        <rect x="20" y="20" width="120" height="25" rx="8" fill="rgba(56, 189, 248, 0.1)"/>
        <text x="30" y="36" fill="var(--text-primary)" font-size="10" font-weight="bold" font-family="monospace">PATIENTS</text>
        <text x="30" y="60" fill="var(--text-secondary)" font-size="8" font-family="monospace">🔑 patient_id (INT)</text>
        <text x="30" y="78" fill="var(--text-muted)" font-size="8" font-family="monospace"># first_name</text>
        <text x="30" y="96" fill="var(--text-muted)" font-size="8" font-family="monospace"># last_name</text>
        <text x="30" y="114" fill="var(--text-muted)" font-size="8" font-family="monospace"># age_group</text>
        
        <!-- Medical Records Table Card -->
        <rect x="180" y="20" width="120" height="120" rx="8" fill="rgba(23, 32, 51, 0.7)" stroke="var(--accent-teal)" stroke-width="1.5"/>
        <rect x="180" y="20" width="120" height="25" rx="8" fill="rgba(45, 212, 191, 0.1)"/>
        <text x="190" y="36" fill="var(--text-primary)" font-size="10" font-weight="bold" font-family="monospace">RECORDS</text>
        <text x="190" y="60" fill="var(--text-secondary)" font-size="8" font-family="monospace">🔑 record_id (INT)</text>
        <text x="190" y="78" fill="var(--text-secondary)" font-size="8" font-family="monospace">🔗 patient_id (FK)</text>
        <text x="190" y="96" fill="var(--text-muted)" font-size="8" font-family="monospace"># diagnosis</text>
        <text x="190" y="114" fill="var(--text-muted)" font-size="8" font-family="monospace"># date_admitted</text>
        
        <!-- Relations lines -->
        <!-- Link patient_id from Patients to Records -->
        <path d="M 140 60 L 160 60 L 160 78 L 180 78" fill="none" stroke="var(--accent-cyan)" stroke-width="1.5" stroke-dasharray="3"/>
        <circle cx="140" cy="60" r="3" fill="var(--accent-cyan)"/>
        <polygon points="180,78 174,75 174,81" fill="var(--accent-cyan)"/>
        
        <!-- Link record_id from Records to Billing -->
        <path d="M 300 60 L 320 60 L 320 60 L 340 60" fill="none" stroke="var(--accent-teal)" stroke-width="1.5" stroke-dasharray="3"/>
        <circle cx="300" cy="60" r="3" fill="var(--accent-teal)"/>
        
        <!-- Billing Table Card -->
        <rect x="340" y="20" width="100" height="100" rx="8" fill="rgba(23, 32, 51, 0.7)" stroke="var(--accent-indigo)" stroke-width="1.5"/>
        <rect x="340" y="20" width="100" height="25" rx="8" fill="rgba(129, 140, 248, 0.1)"/>
        <text x="350" y="36" fill="var(--text-primary)" font-size="10" font-weight="bold" font-family="monospace">BILLING</text>
        <text x="350" y="60" fill="var(--text-secondary)" font-size="8" font-family="monospace">🔗 record_id (FK)</text>
        <text x="350" y="78" fill="var(--text-muted)" font-size="8" font-family="monospace"># billing_amount</text>
        <text x="350" y="96" fill="var(--text-muted)" font-size="8" font-family="monospace"># payment_status</text>
      </svg>
    `,
    tableHtml: `
      <div class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>demographic_group</th>
              <th>patient_count</th>
              <th>total_billing</th>
              <th>average_per_patient</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Senior Citizen (65+)</td>
              <td>124</td>
              <td>$182,450.00</td>
              <td>$1,471.37</td>
            </tr>
            <tr>
              <td>Adult (30-64)</td>
              <td>210</td>
              <td>$142,320.00</td>
              <td>$677.71</td>
            </tr>
            <tr>
              <td>Youth (18-29)</td>
              <td>85</td>
              <td>$54,200.00</td>
              <td>$637.64</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  }
};

const projectModal = document.getElementById('project-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalBody = document.getElementById('modal-body');
const projectCards = document.querySelectorAll('.project-card[data-project]');

function openProjectModal(projectKey) {
  const data = projectDetails[projectKey];
  if (!data) return;
  
  modalBody.innerHTML = `
    <span class="modal-subtitle">${data.subtitle}</span>
    <h2 style="margin-bottom: 0.5rem;">${data.title}</h2>
    <p style="margin-bottom: 1.5rem;">${data.description}</p>
    
    <h3 style="font-size: 0.95rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.75rem;">Source Code Implementation</h3>
    <div class="code-container">
      <div class="code-header">
        <span><i class="fa-solid fa-code" style="margin-right: 6px;"></i> ${data.codeHeader}</span>
        <span>UTF-8</span>
      </div>
      <pre><code>${escapeHtml(data.code)}</code></pre>
    </div>
    
    <div class="modal-chart-container">
      ${data.chartHtml}
    </div>
    
    <h3 style="font-size: 0.95rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 1rem;">Structured Output Preview</h3>
    ${data.tableHtml}
  `;
  
  projectModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  projectModal.classList.remove('active');
  document.body.style.overflow = '';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================================
   7. PROFESSIONAL CERTIFICATION DETAILS & INTERACTIVE WIDGETS
   ========================================================================= */
const certDetails = {
  chatbot: {
    title: "AI-Powered Chatbot Development",
    subtitle: "Focus: LLMs, LangChain & OpenAI API Integration",
    description: "Built conversational agents utilizing API architectures. Designed prompt engineering patterns, contextual memory pipelines, and system rubrics to evaluate chatbot reasoning consistency.",
    codeHeader: "chatbot_agent.py",
    code: `import openai
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

# Initialize LLM client and contextual memory
llm = openai.OpenAI(api_key="your_api_key")
memory = ConversationBufferMemory()

# Create Conversation Pipeline
conversation = ConversationChain(
    llm=llm, 
    verbose=True, 
    memory=memory
)

# Run interactive dialogue
response = conversation.predict(input="Verify standard deviation limits.")
print(response)`,
    widgetHtml: `
      <h3 style="font-size: 0.95rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Interactive Agent Sandbox</h3>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Ask the LLM agent about Jasleen's qualifications or projects below:</p>
      <div class="chat-box">
        <div class="chat-messages" id="chat-msgs-container">
          <div class="chat-msg bot">Hello! I am Jasleen's AI evaluation assistant. Type a question below to test my reasoning capabilities!</div>
        </div>
        <div class="chat-input-area">
          <input type="text" id="chat-input-field" placeholder="Ask about: GPA, Skills, Projects, or TA experience..." onkeydown="if(event.key === 'Enter') document.getElementById('send-chat-btn').click();">
          <button id="send-chat-btn">Send</button>
        </div>
      </div>
    `
  },
  classifier: {
    title: "ML Image Classifier using Python",
    subtitle: "Focus: CNN, TensorFlow, Keras & Computer Vision",
    description: "Trained convolutional neural networks (CNNs) in TensorFlow to classify images. Measured validation metrics (Precision, Recall, F1, Loss) and loaded models to predict classes in real-time.",
    codeHeader: "cnn_image_classifier.py",
    code: `import tensorflow as tf
from tensorflow.keras import layers, models

# Build Convolutional Neural Network
model = models.Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(64, 64, 3)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(4, activation='softmax') # 4 target classes
])

# Compile Model
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])`,
    widgetHtml: `
      <h3 style="font-size: 0.95rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Interactive CNN Classifier Sandbox</h3>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Choose a sample image to run through the simulated Keras Neural Network:</p>
      
      <div class="classifier-container">
        <div class="classifier-img-picker">
          <div class="picker-btn active" data-img="football">
            <i class="fa-solid fa-volleyball"></i>
            <span>Soccer Ball</span>
          </div>
          <div class="picker-btn" data-img="airplane">
            <i class="fa-solid fa-plane"></i>
            <span>Airplane</span>
          </div>
          <div class="picker-btn" data-img="cat">
            <i class="fa-solid fa-cat"></i>
            <span>Feline (Cat)</span>
          </div>
          <div class="picker-btn" data-img="dog">
            <i class="fa-solid fa-dog"></i>
            <span>Canine (Dog)</span>
          </div>
        </div>
        
        <div class="classifier-view">
          <i class="fa-solid fa-volleyball" id="classifier-current-icon"></i>
          <div class="classifier-results">
            <div class="class-probability">
              <div class="class-label-row">
                <span>Soccer Ball</span>
                <span id="prob-val-1">94%</span>
              </div>
              <div class="prob-bar-bg">
                <div class="prob-bar-fill" id="prob-bar-1" style="width: 94%;"></div>
              </div>
            </div>
            <div class="class-probability">
              <div class="class-label-row">
                <span>Canine (Dog)</span>
                <span id="prob-val-2">3%</span>
              </div>
              <div class="prob-bar-bg">
                <div class="prob-bar-fill" id="prob-bar-2" style="width: 3%; background: var(--accent-indigo);"></div>
              </div>
            </div>
            <div class="class-probability">
              <div class="class-label-row">
                <span>Other Classes</span>
                <span id="prob-val-3">3%</span>
              </div>
              <div class="prob-bar-bg">
                <div class="prob-bar-fill" id="prob-bar-3" style="width: 3%; background: var(--accent-purple);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  sentiment: {
    title: "Twitter Sentiment Analysis with NLP",
    subtitle: "Focus: Tokenization, TF-IDF, Logistic Regression",
    description: "Designed Natural Language Processing (NLP) pipelines using NLTK and Scikit-learn. Performed lexical tokenization, stop-words extraction, and trained linear models to categorize social feed text into positive or negative sentiments.",
    codeHeader: "twitter_nlp.py",
    code: `import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Build TF-IDF + Classifier Pipeline
nlp_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000)),
    ('clf', LogisticRegression(C=1.0))
])

# Fit Pipeline on labeled tweets
# nlp_pipeline.fit(X_train, y_train)
# predictions = nlp_pipeline.predict(X_test)`,
    widgetHtml: `
      <h3 style="font-size: 0.95rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Interactive NLP Sentiment Sandbox</h3>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Type a statement or tweet below to split tokens and predict sentiment metrics:</p>
      
      <div class="sentiment-input-group">
        <input type="text" id="sentiment-input" value="I love data science! It is incredibly exciting." placeholder="Type a sentence here..." style="width: 100%;">
        <button class="btn btn-primary" id="analyze-sentiment-btn" style="padding: 0.85rem 1.5rem;">Analyze</button>
      </div>
      
      <div class="tokens-container" id="sentiment-tokens-box">
        <!-- Tokens will be placed here -->
      </div>
      
      <div class="sentiment-results-row">
        <div style="font-size: 0.8rem; color: var(--text-muted);">PREDICTION CONFIDENCE</div>
        <div class="sentiment-score-badge pos" id="sentiment-output-badge">POSITIVE (92%)</div>
      </div>
    `
  },
  jhu: {
    title: "JHU Data Science Crash Course",
    subtitle: "Focus: Data Analysis Workflow, R Markdown, Statistics",
    description: "Investigated structural data summaries, descriptive statistics (mean, variance, quartiles), and explored exploratory plotting inside the R programming environment.",
    codeHeader: "eda_statistics.R",
    code: `# load raw observations
df <- read.csv("observations.csv")

# calculate mean, median, quartiles
summary(df$measurement)

# compute variance & standard deviation
var(df$measurement)
sd(df$measurement)

# plot boxplot to locate outlier bounds
boxplot(df$measurement, 
        main="Observation Quantiles", 
        col="skyblue", 
        horizontal=TRUE)`,
    widgetHtml: `
      <h3 style="font-size: 0.95rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Exploratory Statistics View</h3>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Render descriptive statistics and quantile distributions for a sample population:</p>
      
      <div class="modal-chart-container" style="background: var(--bg-secondary); padding: 1.5rem;">
        <svg width="400" height="120" viewBox="0 0 400 120">
          <!-- Quantile Boxplot representation -->
          <!-- Whiskers -->
          <line x1="60" y1="60" x2="340" y2="60" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
          <line x1="60" y1="40" x2="60" y2="80" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
          <line x1="340" y1="40" x2="340" y2="80" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
          
          <!-- Box (IQR) -->
          <rect x="140" y="30" width="120" height="60" fill="rgba(129, 140, 248, 0.2)" stroke="var(--accent-indigo)" stroke-width="2"/>
          
          <!-- Median -->
          <line x1="190" y1="30" x2="190" y2="90" stroke="var(--accent-teal)" stroke-width="3"/>
          
          <!-- Labels -->
          <text x="60" y="105" fill="var(--text-muted)" font-size="8" text-anchor="middle">Min (Q0)</text>
          <text x="140" y="105" fill="var(--text-muted)" font-size="8" text-anchor="middle">25% (Q1)</text>
          <text x="190" y="105" fill="var(--accent-teal)" font-size="8" font-weight="bold" text-anchor="middle">Median (Q2)</text>
          <text x="260" y="105" fill="var(--text-muted)" font-size="8" text-anchor="middle">75% (Q3)</text>
          <text x="340" y="105" fill="var(--text-muted)" font-size="8" text-anchor="middle">Max (Q4)</text>
          
          <text x="200" y="18" fill="var(--text-primary)" font-size="10" font-weight="600" text-anchor="middle">Distribution Quantiles (Population Dataset)</text>
        </svg>
      </div>
    `
  }
};

const certCards = document.querySelectorAll('.cert-card[data-cert]');

function openCertModal(certKey) {
  const data = certDetails[certKey];
  if (!data) return;
  
  modalBody.innerHTML = `
    <span class="modal-subtitle">${data.subtitle}</span>
    <h2 style="margin-bottom: 0.5rem;">${data.title}</h2>
    <p style="margin-bottom: 1.5rem;">${data.description}</p>
    
    <h3 style="font-size: 0.95rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.75rem;">Project Source Code</h3>
    <div class="code-container">
      <div class="code-header">
        <span><i class="fa-solid fa-code" style="margin-right: 6px;"></i> ${data.codeHeader}</span>
        <span>UTF-8</span>
      </div>
      <pre><code>${escapeHtml(data.code)}</code></pre>
    </div>
    
    <div style="margin-top: 2rem; margin-bottom: 1.5rem;">
      ${data.widgetHtml}
    </div>
  `;
  
  projectModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Post-inject binder routines for the interactive elements
  if (certKey === 'chatbot') {
    bindChatbotLogic();
  } else if (certKey === 'classifier') {
    bindClassifierLogic();
  } else if (certKey === 'sentiment') {
    bindSentimentLogic();
  }
}

// 1. LLM Chatbot Simulation Logic
function bindChatbotLogic() {
  const sendBtn = document.getElementById('send-chat-btn');
  const chatInput = document.getElementById('chat-input-field');
  const chatContainer = document.getElementById('chat-msgs-container');
  
  if (!sendBtn || !chatInput || !chatContainer) return;
  
  const botResponses = {
    gpa: "Jasleen has an impressive cumulative score of 83% in her Master's in Data Science at Manipal Academy, and graduated with 79.55% in her B.Tech Computer Science degree.",
    skills: "She specializes in Python (NumPy, SciPy, Pandas, Scikit-learn), R programming, SQL databases, and full stack web development (HTML, CSS, JavaScript).",
    projects: "Her projects include linear regression modeling in R, FIFA datasets pipeline building in Python, and CRM patient-billing database architecture using MySQL Workbench.",
    experience: "She worked as a Teaching Assistant at Chitkara University (2018-2020), instructing students in Web Technologies (HTML/CSS) and Data Structures while researching digital Watermarking.",
    default: "I can tell you about Jasleen's GPA, technical skills, projects, or work history. What would you like to verify?"
  };

  sendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = text;
    chatContainer.appendChild(userMsg);
    
    chatInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Bot thinking & reply
    setTimeout(() => {
      const lower = text.toLowerCase();
      let replyText = botResponses.default;
      
      if (lower.includes('gpa') || lower.includes('g.p.a') || lower.includes('marks') || lower.includes('grade')) {
        replyText = botResponses.gpa;
      } else if (lower.includes('skill') || lower.includes('tool') || lower.includes('language') || lower.includes('code')) {
        replyText = botResponses.skills;
      } else if (lower.includes('project') || lower.includes('portfolio') || lower.includes('build')) {
        replyText = botResponses.projects;
      } else if (lower.includes('experience') || lower.includes('work') || lower.includes('teach') || lower.includes('assistant') || lower.includes('university')) {
        replyText = botResponses.experience;
      }
      
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-msg bot';
      botMsg.textContent = replyText;
      chatContainer.appendChild(botMsg);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 600);
  });
}

// 2. Convolutional Neural Network Image Classifier Logic
function bindClassifierLogic() {
  const buttons = document.querySelectorAll('.picker-btn[data-img]');
  const currentIcon = document.getElementById('classifier-current-icon');
  
  const prob1 = document.getElementById('prob-bar-1');
  const probVal1 = document.getElementById('prob-val-1');
  const prob2 = document.getElementById('prob-bar-2');
  const probVal2 = document.getElementById('prob-val-2');
  
  if (!buttons || !currentIcon) return;
  
  const imgClasses = {
    football: {
      icon: 'fa-volleyball',
      p1: '94%',
      p2: '3%',
      label1: 'Soccer Ball',
      label2: 'Canine (Dog)'
    },
    airplane: {
      icon: 'fa-plane',
      p1: '97%',
      p2: '2%',
      label1: 'Airplane',
      label2: 'Feline (Cat)'
    },
    cat: {
      icon: 'fa-cat',
      p1: '89%',
      p2: '8%',
      label1: 'Feline (Cat)',
      label2: 'Canine (Dog)'
    },
    dog: {
      icon: 'fa-dog',
      p1: '91%',
      p2: '6%',
      label1: 'Canine (Dog)',
      label2: 'Feline (Cat)'
    }
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active states
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const target = btn.getAttribute('data-img');
      const data = imgClasses[target];
      if (!data) return;
      
      // Update classifier view icon
      currentIcon.className = `fa-solid ${data.icon}`;
      
      // Animate probabilities
      prob1.style.width = '0%';
      prob2.style.width = '0%';
      
      setTimeout(() => {
        prob1.style.width = data.p1;
        probVal1.textContent = data.p1;
        prob1.parentNode.previousElementSibling.firstElementChild.textContent = data.label1;
        
        prob2.style.width = data.p2;
        probVal2.textContent = data.p2;
        prob2.parentNode.previousElementSibling.firstElementChild.textContent = data.label2;
      }, 50);
    });
  });
}

// 3. Sentiment Analysis Logic
function bindSentimentLogic() {
  const analyzeBtn = document.getElementById('analyze-sentiment-btn');
  const inputEl = document.getElementById('sentiment-input');
  const tokensBox = document.getElementById('sentiment-tokens-box');
  const outputBadge = document.getElementById('sentiment-output-badge');
  
  if (!analyzeBtn || !inputEl || !tokensBox || !outputBadge) return;
  
  const positiveWords = ['love', 'like', 'good', 'great', 'awesome', 'exciting', 'happy', 'best', 'incredible', 'enjoy', 'wonderful', 'outstanding', 'strong', 'rigorous'];
  const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'unhappy', 'slow', 'error', 'failed', 'hate', 'sad', 'wrong'];

  function runSentimentAnalysis() {
    const text = inputEl.value.trim();
    if (!text) return;
    
    // Clear old tokens
    tokensBox.innerHTML = '';
    
    // Basic text cleaner & splitter
    const words = text.split(/\\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      if (!clean) return;
      
      const tokenSpan = document.createElement('span');
      tokenSpan.className = 'token';
      tokenSpan.textContent = word;
      
      if (positiveWords.includes(clean)) {
        tokenSpan.classList.add('pos');
        positiveScore++;
      } else if (negativeWords.includes(clean)) {
        tokenSpan.classList.add('neg');
        negativeScore++;
      }
      
      tokensBox.appendChild(tokenSpan);
    });
    
    // Determine overall sentiment
    outputBadge.className = 'sentiment-score-badge';
    if (positiveScore > negativeScore) {
      const confidence = Math.min(60 + (positiveScore * 10), 98);
      outputBadge.classList.add('pos');
      outputBadge.textContent = `POSITIVE (${confidence}%)`;
    } else if (negativeScore > positiveScore) {
      const confidence = Math.min(60 + (negativeScore * 10), 98);
      outputBadge.classList.add('neg');
      outputBadge.textContent = `NEGATIVE (${confidence}%)`;
    } else {
      outputBadge.classList.add('neu');
      outputBadge.textContent = 'NEUTRAL (50%)';
    }
  }

  analyzeBtn.addEventListener('click', runSentimentAnalysis);
  // Run once initially
  runSentimentAnalysis();
}


// Click bindings for cert cards
certCards.forEach(card => {
  card.addEventListener('click', () => {
    const key = card.getAttribute('data-cert');
    openCertModal(key);
  });
});

projectCards.forEach(card => {
  card.addEventListener('click', () => {
    const key = card.getAttribute('data-project');
    openProjectModal(key);
  });
});

modalClose.addEventListener('click', closeProjectModal);
modalOverlay.addEventListener('click', closeProjectModal);
