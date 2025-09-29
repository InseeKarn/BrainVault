const fs = require('fs').promises;
const path = require('path');

/**
 * Static Problem Service
 * Loads pre-generated problems from JSON files instead of using AI at runtime
 * This avoids AI API costs while providing high-quality problems
 */
class StaticProblemService {
  constructor() {
    this.problemsDir = path.join(__dirname, '../database/generated_problems');
    this.problemCache = new Map();
    this.metadata = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('🔄 Initializing Static Problem Service...');
    
    try {
      // Load all problem files
      const branches = ['mechanics','thermodynamics','electromagnetism','optics','modern_physics','acoustics','astrophysics','condensed_matter','plasma','biophysics','geophysics','computational_physics'];
      
      for (const branch of branches) {
        await this.loadBranchProblems(branch);
      }
      
      this.initialized = true;
      console.log('✅ Static Problem Service initialized successfully');
      console.log(`📊 Total problems loaded: ${this.getTotalProblemsCount()}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Static Problem Service:', error);
      throw error;
    }
  }

  async loadBranchProblems(branch) {
    const filename = `${branch}_problems.json`;
    const filepath = path.join(this.problemsDir, filename);
    
    try {
      const fileContent = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(fileContent);
      
      // Store problems and metadata
      this.problemCache.set(branch, data.problems);
      this.metadata.set(branch, data.metadata);
      
      console.log(`📚 Loaded ${data.problems.length} problems for ${branch}`);
      
    } catch (error) {
      console.error(`❌ Failed to load problems for ${branch}:`, error.message);
      
      // Fallback: create empty array for this branch
      this.problemCache.set(branch, []);
      this.metadata.set(branch, { 
        branch, 
        total_problems: 0, 
        error: 'Failed to load problems' 
      });
    }
  }

  getTotalProblemsCount() {
    let total = 0;
    for (const [branch, problems] of this.problemCache) {
      total += problems.length;
    }
    return total;
  }

  getBranchProblems(branch) {
    return this.problemCache.get(branch) || [];
  }

  getBranchMetadata(branch) {
    return this.metadata.get(branch) || null;
  }

  getAllBranches() {
    return Array.from(this.problemCache.keys());
  }

  /**
   * Get problems with filtering options
   */
  getProblems(options = {}) {
    const {
      branch = null,
      branchList = null,
      difficulty = null,
      limit = 10,
      offset = 0,
      subbranch = null,
      randomize = false
    } = options;

    let allProblems = [];

    // Collect problems from specified branch(es) or all branches
    const keys = branchList && Array.isArray(branchList) && branchList.length ? branchList
               : (branch ? [branch] : null);

    if (keys) {
      keys.forEach(k => {
        const ps = this.getBranchProblems(k);
        if (ps && ps.length) allProblems = allProblems.concat(ps);
      });
    } else {
      // Get from all branches
      for (const [branchName, problems] of this.problemCache) {
        allProblems = allProblems.concat(problems);
      }
    }

    // Apply filters
    if (difficulty) {
      const targetDifficulty = difficulty.toLowerCase();
      allProblems = allProblems.filter(problem => 
        problem.difficulty.toLowerCase() === targetDifficulty
      );
    }

    if (subbranch) {
      const targetSubbranch = subbranch.toLowerCase();
      allProblems = allProblems.filter(problem =>
        problem.subbranch.toLowerCase().includes(targetSubbranch)
      );
    }

    // Randomize if requested
    if (randomize) {
      allProblems = this.shuffleArray([...allProblems]);
    }

    // Apply pagination
    const totalCount = allProblems.length;
    const paginatedProblems = allProblems.slice(offset, offset + limit);

    return {
      problems: paginatedProblems,
      total: totalCount,
      offset,
      limit,
      hasMore: offset + limit < totalCount
    };
  }

  /**
   * Get a specific problem by ID
   */
  getProblemById(problemId) {
    for (const [branch, problems] of this.problemCache) {
      const problem = problems.find(p => p.id === problemId);
      if (problem) {
        return problem;
      }
    }
    return null;
  }

  /**
   * Get problems by multiple IDs
   */
  getProblemsByIds(problemIds) {
    const result = [];
    for (const id of problemIds) {
      const problem = this.getProblemById(id);
      if (problem) {
        result.push(problem);
      }
    }
    return result;
  }

  /**
   * Get random problems from any branch
   */
  getRandomProblems(count = 5, options = {}) {
    const { difficulty = null, branch = null } = options;
    
    const filteredProblems = this.getProblems({
      branch,
      difficulty,
      limit: 1000, // Get more for better randomization
      randomize: true
    });

    return {
      problems: filteredProblems.problems.slice(0, count),
      total: count
    };
  }

  /**
   * Get problems for a practice session
   */
  getPracticeSession(options = {}) {
    const {
      branch = null,
      difficulty = 'medium',
      count = 10,
      focusAreas = [] // Array of subbranches to focus on
    } = options;

    let problems = [];

    if (focusAreas.length > 0) {
      // Get problems from specific focus areas
      for (const area of focusAreas) {
        const areaProblems = this.getProblems({
          branch,
          difficulty,
          subbranch: area,
          limit: Math.ceil(count / focusAreas.length),
          randomize: true
        });
        problems = problems.concat(areaProblems.problems);
      }
    } else {
      // Get general problems
      const sessionProblems = this.getProblems({
        branch,
        difficulty,
        limit: count,
        randomize: true
      });
      problems = sessionProblems.problems;
    }

    // Ensure we don't exceed requested count
    problems = problems.slice(0, count);

    return {
      problems,
      session_id: this.generateSessionId(),
      difficulty,
      branch,
      count: problems.length,
      total_xp: problems.reduce((sum, p) => sum + (p.xp_reward || 0), 0)
    };
  }

  /**
   * Get difficulty distribution for a branch
   */
  getDifficultyDistribution(branch = null) {
    const problems = branch ? this.getBranchProblems(branch) : this.getAllProblems();
    const distribution = {};

    problems.forEach(problem => {
      const difficulty = problem.difficulty.toLowerCase();
      distribution[difficulty] = (distribution[difficulty] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get subbranch list for a branch
   */
  getSubbranches(branch) {
    const problems = this.getBranchProblems(branch);
    const subbranches = new Set();
    
    problems.forEach(problem => {
      if (problem.subbranch) {
        subbranches.add(problem.subbranch);
      }
    });

    return Array.from(subbranches).sort();
  }

  /**
   * Get all problems (helper method)
   */
  getAllProblems() {
    let allProblems = [];
    for (const [branch, problems] of this.problemCache) {
      allProblems = allProblems.concat(problems);
    }
    return allProblems;
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const stats = {
      total_problems: this.getTotalProblemsCount(),
      branches: this.getAllBranches().length,
      problems_by_branch: {},
      difficulty_distribution: this.getDifficultyDistribution(),
      initialization_status: this.initialized,
      last_updated: new Date().toISOString()
    };

    // Add per-branch statistics
    for (const branch of this.getAllBranches()) {
      const branchProblems = this.getBranchProblems(branch);
      const metadata = this.getBranchMetadata(branch);
      
      stats.problems_by_branch[branch] = {
        count: branchProblems.length,
        subbranches: this.getSubbranches(branch),
        difficulty_distribution: this.getDifficultyDistribution(branch),
        metadata: metadata
      };
    }

    return stats;
  }

  /**
   * Utility methods
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized && this.getTotalProblemsCount() > 0;
  }

  /**
   * Reload problems from disk (useful for updates)
   */
  async reload() {
    console.log('🔄 Reloading problems from disk...');
    this.problemCache.clear();
    this.metadata.clear();
    this.initialized = false;
    await this.initialize();
  }
}

// Create and export singleton instance
const staticProblemService = new StaticProblemService();

module.exports = {
  StaticProblemService,
  staticProblemService
};