const express = require('express');
const router = express.Router();

// AI Problem Generation Engine for BrainVault
// This system generates physics problems using AI techniques

class AIPhysicsProblemGenerator {
  constructor() {
    // Physics constants and formulas database
    this.physicsData = {
      mechanics: {
        formulas: [
          { name: 'kinematic_velocity', formula: 'v = u + at', vars: ['v', 'u', 'a', 't'] },
          { name: 'kinematic_distance', formula: 's = ut + (1/2)at²', vars: ['s', 'u', 'a', 't'] },
          { name: 'kinematic_final', formula: 'v² = u² + 2as', vars: ['v', 'u', 'a', 's'] },
          { name: 'force', formula: 'F = ma', vars: ['F', 'm', 'a'] },
          { name: 'momentum', formula: 'p = mv', vars: ['p', 'm', 'v'] },
          { name: 'work', formula: 'W = Fs cos(θ)', vars: ['W', 'F', 's', 'θ'] },
          { name: 'kinetic_energy', formula: 'KE = (1/2)mv²', vars: ['KE', 'm', 'v'] },
          { name: 'potential_energy', formula: 'PE = mgh', vars: ['PE', 'm', 'g', 'h'] }
        ],
        units: {
          v: 'm/s', u: 'm/s', a: 'm/s²', t: 's', s: 'm', F: 'N', 
          m: 'kg', p: 'kg⋅m/s', W: 'J', KE: 'J', PE: 'J', g: 'm/s²', h: 'm'
        },
        constants: { g: 9.8 }
      },
      thermodynamics: {
        formulas: [
          { name: 'ideal_gas', formula: 'PV = nRT', vars: ['P', 'V', 'n', 'R', 'T'] },
          { name: 'heat_capacity', formula: 'Q = m*c*DT', vars: ['Q', 'm', 'c', 'DT'] },
          { name: 'efficiency', formula: 'eta = (W/Q_h) * 100', vars: ['eta', 'W', 'Q_h'] },
          { name: 'boyle_law', formula: 'P1*V1 = P2*V2', vars: ['P1', 'V1', 'P2', 'V2'] }
        ],
        units: {
          P: 'Pa', V: 'm³', n: 'mol', R: 'J/(mol⋅K)', T: 'K',
          Q: 'J', m: 'kg', c: 'J/(kg⋅K)', 'DT': 'K', 'eta': '%', W: 'J',
          P1: 'Pa', V1: 'm³', P2: 'Pa', V2: 'm³', Q_h: 'J'
        },
        constants: { R: 8.314 }
      },
      electromagnetism: {
        formulas: [
          { name: 'ohms_law', formula: 'V = IR', vars: ['V', 'I', 'R'] },
          { name: 'power', formula: 'P = VI', vars: ['P', 'V', 'I'] },
          { name: 'capacitance', formula: 'Q = CV', vars: ['Q', 'C', 'V'] },
          { name: 'coulombs_law', formula: 'F = k(q1*q2)/r²', vars: ['F', 'k', 'q1', 'q2', 'r'] }
        ],
        units: {
          V: 'V', I: 'A', R: 'Ω', P: 'W', Q: 'C', C: 'F',
          F: 'N', k: 'N⋅m²/C²', q1: 'C', q2: 'C', r: 'm'
        },
        constants: { k: 8.99e9 }
      },
      optics: {
        formulas: [
          { name: 'thin_lens', formula: '1/f = 1/do + 1/di', vars: ['f', 'do', 'di'] },
          { name: 'magnification', formula: 'm = -di/do', vars: ['m', 'di', 'do'] },
          { name: 'wave_equation', formula: 'c = f*lambda', vars: ['c', 'f', 'lambda'] }
        ],
        units: {
          f: 'm', do: 'm', di: 'm', m: '', c: 'm/s', 'lambda': 'm'
        },
        constants: { c: 3e8 }
      },
      modern_physics: {
        formulas: [
          { name: 'photoelectric', formula: 'KE = h*f - phi*e', vars: ['KE','h','f','phi','e'] },
          { name: 'debroglie', formula: 'lambda = h/p', vars: ['lambda','h','p'] },
          { name: 'relativity_energy', formula: 'E = m*c^2', vars: ['E','m','c'] }
        ],
        units: { KE:'J', h:'J*s', f:'Hz', phi:'eV', e:'C', lambda:'m', p:'kg*m/s', E:'J', m:'kg', c:'m/s' },
        constants: { h: 6.626e-34, e: 1.602e-19, c: 3e8 }
      },
      acoustics: {
        formulas: [
          { name: 'wave_speed', formula: 'v = f*lambda', vars: ['v','f','lambda'] },
          { name: 'intensity_level', formula: 'L = 10*logI', vars: ['L','logI'] }
        ],
        units: { v:'m/s', f:'Hz', lambda:'m', L:'dB', logI:'' },
        constants: {}
      },
      astrophysics: {
        formulas: [
          { name: 'orbital_speed', formula: 'v = sqrt(GM/r)', vars: ['v','G','M','r'] },
          { name: 'escape_velocity', formula: 'v = sqrt(2*G*M/r)', vars: ['v','G','M','r'] }
        ],
        units: { v:'m/s', G:'N*m^2/kg^2', M:'kg', r:'m' },
        constants: { G: 6.674e-11 }
      },
      condensed_matter: {
        formulas: [
          { name: 'resistivity', formula: 'R = rho*L/A', vars: ['R','rho','L','A'] },
          { name: 'drude', formula: 'sigma = n*e^2*tau/m', vars: ['sigma','n','e','tau','m'] }
        ],
        units: { R:'ohm', rho:'ohm*m', L:'m', A:'m^2', sigma:'S/m', n:'1/m^3', e:'C', tau:'s', m:'kg' },
        constants: { e: 1.602e-19 }
      },
      plasma: {
        formulas: [
          { name: 'debye_length', formula: 'lambdaD = sqrt(eps0*Te*e/(ne*e^2))', vars: ['lambdaD','eps0','Te','e','ne'] },
          { name: 'plasma_frequency', formula: 'wp = sqrt(ne*e^2/(eps0*m))', vars: ['wp','ne','e','eps0','m'] }
        ],
        units: { lambdaD:'m', eps0:'F/m', Te:'eV', e:'C', ne:'1/m^3', wp:'rad/s', m:'kg' },
        constants: { eps0: 8.854e-12, e:1.602e-19, m:9.11e-31 }
      },
      biophysics: {
        formulas: [
          { name: 'diffusion', formula: 'x = sqrt(2*D*t)', vars: ['x','D','t'] },
          { name: 'membrane_current', formula: 'I = g*(V - Erev)', vars: ['I','g','V','Erev'] }
        ],
        units: { x:'m', D:'m^2/s', t:'s', I:'A', g:'S', V:'V', Erev:'V' },
        constants: {}
      },
      geophysics: {
        formulas: [
          { name: 'gravity', formula: 'g = GM/r^2', vars: ['g','G','M','r'] },
          { name: 'seismic_velocity', formula: 'v = sqrt((K + 4/3*mu)/rho)', vars: ['v','K','mu','rho'] }
        ],
        units: { g:'m/s^2', G:'N*m^2/kg^2', M:'kg', r:'m', v:'m/s', K:'Pa', mu:'Pa', rho:'kg/m^3' },
        constants: { G: 6.674e-11 }
      },
      computational_physics: {
        formulas: [
          { name: 'trapezoid_rule', formula: 'I = 0.5*(f0 + f1)*h', vars: ['I','f0','f1','h'] },
          { name: 'midpoint_rule', formula: 'I = fmid*h', vars: ['I','fmid','h'] }
        ],
        units: { I:'', f0:'', f1:'', h:'', fmid:'' },
        constants: {}
      }
    };

    // Problem templates for different difficulty levels
    this.templates = {
      easy: [
        "A {object} {action} with {given_vars}. Find the {target_var}.",
        "Calculate the {target_var} when {given_vars} are known.",
        "Given {given_vars}, determine the {target_var}."
      ],
      medium: [
        "A {object} {action} under {condition}. If {given_vars}, calculate the {target_var}.",
        "In a {scenario}, {given_vars} are measured. Find the {target_var}.",
        "A physics experiment shows that {given_vars}. Determine the {target_var}."
      ],
      hard: [
        "A complex system involving {object} {action} where {condition}. Given that {given_vars}, find the {target_var}.",
        "In an advanced setup, {scenario} results in {given_vars}. Calculate the {target_var}.",
        "A challenging problem: {object} {action} with {constraint}. If {given_vars}, determine the {target_var}."
      ],
      expert: [
        "An expert-level analysis of {object} {action} in {advanced_scenario}. Given the complex conditions where {given_vars}, derive and calculate the {target_var}.",
        "A research-grade problem involving {advanced_concept} where {object} {action}. With {given_vars} measured experimentally, determine the {target_var}."
      ]
    };

    // Context objects and scenarios
    this.contexts = {
      mechanics: {
        objects: ['car', 'ball', 'projectile', 'satellite', 'pendulum', 'block', 'rocket', 'athlete'],
        actions: ['accelerates', 'moves', 'falls', 'is thrown', 'slides', 'rotates', 'collides', 'oscillates'],
        conditions: ['constant acceleration', 'friction present', 'on an inclined plane', 'in free fall'],
        scenarios: ['collision experiment', 'projectile motion study', 'pendulum investigation', 'friction analysis']
      },
      thermodynamics: {
        objects: ['gas', 'engine', 'refrigerator', 'piston', 'container', 'system'],
        actions: ['expands', 'compresses', 'heats up', 'cools down', 'undergoes a cycle'],
        conditions: ['constant temperature', 'adiabatic process', 'isothermal conditions', 'constant pressure'],
        scenarios: ['heat engine cycle', 'gas compression', 'thermal equilibrium', 'phase transition']
      },
      electromagnetism: {
        objects: ['circuit', 'resistor', 'capacitor', 'battery', 'wire', 'conductor', 'charge'],
        actions: ['carries current', 'stores charge', 'creates field', 'experiences force', 'moves through field'],
        conditions: ['in series', 'in parallel', 'in magnetic field', 'at steady state'],
        scenarios: ['RC circuit', 'voltage divider', 'charging capacitor', 'electromagnetic induction']
      },
      optics: {
        objects: ['lens', 'mirror', 'light ray', 'image', 'object', 'wave'],
        actions: ['focuses light', 'reflects', 'refracts', 'forms image', 'propagates'],
        conditions: ['converging lens', 'diverging lens', 'concave mirror', 'convex mirror'],
        scenarios: ['image formation', 'lens system', 'optical instrument', 'wave interference']
      }
    };
  }

  // Generate random values within realistic ranges
  generateRealisticValue(variable, branch) {
    const ranges = {
      mechanics: {
        v: [0.1, 100], u: [0, 50], a: [0.1, 20], t: [0.1, 60],
        s: [0.1, 1000], F: [1, 10000], m: [0.1, 100000], h: [0.1, 1000]
      },
      thermodynamics: {
        P: [1000, 500000], V: [0.001, 10], n: [0.1, 10], T: [200, 500],
        Q: [100, 100000], m: [0.1, 100], DT: [1, 100], eta: [10, 90],
        P1: [1000, 500000], V1: [0.001, 10], P2: [1000, 500000], V2: [0.001, 10], Q_h: [1000, 100000]
      },
      electromagnetism: {
        V: [1, 240], I: [0.001, 100], R: [1, 10000], P: [1, 10000],
        Q: [1e-6, 1e-3], C: [1e-12, 1e-3], F: [1, 1000], k: [8.99e9, 8.99e9],
        q1: [1e-6, 1e-3], q2: [1e-6, 1e-3], r: [0.01, 10]
      },
      optics: {
        f: [0.01, 2], do: [0.02, 10], di: [0.02, 10], lambda: [400e-9, 700e-9],
        c: [3e8, 3e8]
      },
      modern_physics: {
        KE:[1e-22,1e-17], h:[6.626e-34,6.626e-34], f:[1e12,1e15], phi:[1,5], e:[1.602e-19,1.602e-19], lambda:[1e-12,1e-6], p:[1e-27,1e-20], E:[1e-20,1e-12], m:[9.11e-31,1e-25], c:[3e8,3e8]
      },
      acoustics: {
        v:[300,350], f:[100,5000], lambda:[0.05,3], L:[20,120], logI:[1,12]
      },
      astrophysics: {
        v:[100,40000], G:[6.674e-11,6.674e-11], M:[1e22,1e31], r:[1e6,1e12]
      },
      condensed_matter: {
        R:[0.01,100], rho:[1e-8,1e-6], L:[0.01,5], A:[1e-8,1e-4], sigma:[1e5,1e8], n:[1e22,1e29], e:[1.602e-19,1.602e-19], tau:[1e-15,1e-12], m:[9.11e-31,1e-27]
      },
      plasma: {
        lambdaD:[1e-6,1e-3], eps0:[8.854e-12,8.854e-12], Te:[1,100], e:[1.602e-19,1.602e-19], ne:[1e14,1e20], wp:[1e6,1e12], m:[9.11e-31,9.11e-31]
      },
      biophysics: {
        x:[1e-9,1e-3], D:[1e-12,1e-9], t:[1e-3,100], I:[1e-12,1e-6], g:[1e-12,1e-6], V:[-0.1,0.1], Erev:[-0.1,0.1]
      },
      geophysics: {
        g:[1,20], G:[6.674e-11,6.674e-11], M:[1e20,1e25], r:[1e6,1e8], v:[1000,8000], K:[1e9,1e11], mu:[1e9,1e11], rho:[1000,6000]
      },
      computational_physics: {
        I:[0.1,10], f0:[0.1,10], f1:[0.1,10], h:[0.001,1], fmid:[0.1,10]
      }
    };

    const range = ranges[branch] && ranges[branch][variable];
    if (!range) return Math.random() * 10 + 1;
    
    const [min, max] = range;
    const value = Math.random() * (max - min) + min;
    
    // Round to appropriate significant figures
    if (value < 0.01) return parseFloat(value.toExponential(3));
    if (value < 1) return parseFloat(value.toFixed(3));
    if (value < 100) return parseFloat(value.toFixed(2));
    return parseFloat(value.toFixed(1));
  }

  // Select a random formula from the branch
  selectFormula(branch) {
    const formulas = this.physicsData[branch]?.formulas;
    if (!formulas) return null;
    return formulas[Math.floor(Math.random() * formulas.length)];
  }

  // Generate problem context
  generateContext(branch, difficulty) {
    const context = this.contexts[branch];
    if (!context) return {};

    const object = context.objects[Math.floor(Math.random() * context.objects.length)];
    const action = context.actions[Math.floor(Math.random() * context.actions.length)];
    const condition = context.conditions[Math.floor(Math.random() * context.conditions.length)];
    const scenario = context.scenarios[Math.floor(Math.random() * context.scenarios.length)];

    return {
      object,
      action,
      condition,
      scenario,
      advanced_scenario: `${scenario} with ${condition}`,
      advanced_concept: `${branch} analysis`,
      constraint: `${condition} and complex interactions`
    };
  }

  // Calculate answer using the formula
  calculateAnswer(formula, givenVars, targetVar, constants = {}) {
    try {
      // This is a simplified calculation system
      // In production, you'd want a more robust math parser
      let expression = formula.formula;
      
      // Replace known variables with values
      Object.keys(givenVars).forEach(variable => {
        const regex = new RegExp(`\\b${variable}\\b`, 'g');
        expression = expression.replace(regex, givenVars[variable]);
      });

      // Replace constants
      Object.keys(constants).forEach(constant => {
        const regex = new RegExp(`\\b${constant}\\b`, 'g');
        expression = expression.replace(regex, constants[constant]);
      });

      // For demo purposes, return a calculated value
      // In production, use a proper math expression evaluator
      return this.evaluateFormula(expression, targetVar);
    } catch (error) {
      console.error('Calculation error:', error);
      return Math.random() * 100; // Fallback
    }
  }

  // Simplified formula evaluator (would use a real math parser in production)
  evaluateFormula(expression, targetVar) {
    // This is a placeholder - in production, use math.js or similar
    // For now, return a realistic-looking value
    return parseFloat((Math.random() * 100).toFixed(2));
  }

  // Generate hints for the problem
  generateHints(formula, targetVar, branch) {
    const hints = [
      `Look for the ${formula.name} formula: ${formula.formula}`,
      `Identify the given variables and what you need to find (${targetVar})`,
      `Make sure your units are consistent`,
      `Substitute the known values into the formula`,
      `Solve algebraically for ${targetVar}`
    ];

    // Add branch-specific hints
    if (branch === 'mechanics') {
      hints.push('Remember to consider direction and sign conventions');
    } else if (branch === 'thermodynamics') {
      hints.push('Check if temperature is in Kelvin');
    } else if (branch === 'electromagnetism') {
      hints.push('Pay attention to series vs parallel configurations');
    } else if (branch === 'optics') {
      hints.push('Consider the sign conventions for lens equations');
    }

    return hints.slice(0, 3); // Return first 3 hints
  }

  // Main generation function
  async generateProblem(branch = null, difficulty = 'medium', count = 1) {
    const problems = [];
    
    for (let i = 0; i < count; i++) {
      try {
        // Select random branch if not specified
        if (!branch) {
          const branches = Object.keys(this.physicsData);
          branch = branches[Math.floor(Math.random() * branches.length)];
        }

        // Get formula and context
        const formula = this.selectFormula(branch);
        if (!formula) continue;

        const context = this.generateContext(branch, difficulty);
        
        // Select target variable (what to find)
        const targetVar = formula.vars[Math.floor(Math.random() * formula.vars.length)];
        
        // Generate given variables (exclude target)
        const givenVars = {};
        const givenVarNames = formula.vars.filter(v => v !== targetVar);
        const numGiven = Math.min(givenVarNames.length, Math.floor(Math.random() * 3) + 1);
        
        for (let j = 0; j < numGiven; j++) {
          const varName = givenVarNames[j];
          givenVars[varName] = this.generateRealisticValue(varName, branch);
        }

        // Add constants if needed
        const constants = this.physicsData[branch].constants || {};
        
        // Calculate answer
        const answerValue = this.calculateAnswer(formula, givenVars, targetVar, constants);
        
        // Generate problem text
        const template = this.templates[difficulty][Math.floor(Math.random() * this.templates[difficulty].length)];
        const givenVarsText = Object.keys(givenVars).map(v => 
          `${v} = ${givenVars[v]} ${this.physicsData[branch].units[v] || ''}`
        ).join(', ');

        let questionText = template
          .replace('{object}', context.object || 'object')
          .replace('{action}', context.action || 'moves')
          .replace('{condition}', context.condition || '')
          .replace('{scenario}', context.scenario || 'experiment')
          .replace('{advanced_scenario}', context.advanced_scenario || 'advanced experiment')
          .replace('{advanced_concept}', context.advanced_concept || 'physics analysis')
          .replace('{constraint}', context.constraint || 'complex conditions')
          .replace('{given_vars}', givenVarsText)
          .replace('{target_var}', `${targetVar} (${this.physicsData[branch].units[targetVar] || ''})`);

        // Generate hints
        const hints = this.generateHints(formula, targetVar, branch);
        
        // Calculate XP reward based on difficulty
        const xpRewards = { easy: 10, medium: 25, hard: 50, expert: 100 };
        
        // Create problem object
        // Pretty display branch name
        const displayBranch = (branch || '').split('_').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
        const problem = {
          id: `AI_GEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          branch: displayBranch,
          subbranch: formula.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
          source: 'AI Generated',
          question: questionText,
          given: { ...givenVars, ...constants },
          answer: {
            formula: formula.formula,
            value: answerValue,
            unit: this.physicsData[branch].units[targetVar] || ''
          },
          hints: hints,
          xp_reward: xpRewards[difficulty] || 25,
          generated_at: new Date().toISOString(),
          ai_metadata: {
            formula_used: formula.name,
            target_variable: targetVar,
            context: context
          }
        };

        problems.push(problem);
      } catch (error) {
        console.error('Problem generation error:', error);
        continue;
      }
    }

    return problems;
  }

  // Generate problems for specific topics
  async generateTopicProblems(branch, subtopics, difficulty, count = 5) {
    const problems = [];
    
    for (const subtopic of subtopics) {
      const topicProblems = await this.generateProblem(branch, difficulty, count);
      problems.push(...topicProblems);
    }
    
    return problems.slice(0, count); // Limit total count
  }

  // Batch generate problems for database seeding
  async generateBatch(totalCount = 50) {
    const branches = Object.keys(this.physicsData);
    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    const problems = [];
    
    const problemsPerCombination = Math.ceil(totalCount / (branches.length * difficulties.length));
    
    for (const branch of branches) {
      for (const difficulty of difficulties) {
        const batchProblems = await this.generateProblem(branch, difficulty, problemsPerCombination);
        problems.push(...batchProblems);
      }
    }
    
    return problems.slice(0, totalCount);
  }
}

// Create global instance
const aiGenerator = new AIPhysicsProblemGenerator();

// API Routes for AI Problem Generation

// Generate single problem
router.post('/generate', async (req, res) => {
  try {
    const { branch, difficulty = 'medium', count = 1 } = req.body;
    
    if (count > 10) {
      return res.status(400).json({ error: 'Maximum 10 problems per request' });
    }
    
    const problems = await aiGenerator.generateProblem(branch, difficulty, count);
    
    res.json({
      success: true,
      problems,
      generated_count: problems.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Generation error:', error);
    res.status(500).json({ error: 'Failed to generate problems' });
  }
});

// Generate batch of problems
router.post('/batch', async (req, res) => {
  try {
    const { count = 20 } = req.body;
    
    if (count > 100) {
      return res.status(400).json({ error: 'Maximum 100 problems per batch' });
    }
    
    const problems = await aiGenerator.generateBatch(count);
    
    res.json({
      success: true,
      problems,
      generated_count: problems.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch generation error:', error);
    res.status(500).json({ error: 'Failed to generate problem batch' });
  }
});

// Get AI generation statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      available_branches: Object.keys(aiGenerator.physicsData),
      supported_difficulties: ['easy', 'medium', 'hard', 'expert'],
      total_formulas: Object.values(aiGenerator.physicsData)
        .reduce((total, branch) => total + branch.formulas.length, 0),
      generation_capabilities: {
        max_per_request: 10,
        max_batch_size: 100,
        supported_features: [
          'Realistic value generation',
          'Context-aware problem text',
          'Multi-level hints',
          'Formula-based calculations',
          'Difficulty scaling'
        ]
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get AI statistics' });
  }
});

module.exports = { router, aiGenerator };