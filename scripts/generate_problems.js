const fs = require('fs').promises;
const path = require('path');

// Import the AI generator
const { aiGenerator } = require('../backend/ai_problem_generator');

// Problem generation configuration
const PROBLEMS_PER_BRANCH = 500;
const BRANCHES = ['mechanics','thermodynamics','electromagnetism','optics','modern_physics','acoustics','astrophysics','condensed_matter','plasma','biophysics','geophysics','computational_physics'];
const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

// Distribution per difficulty (should add up to 500)
const DIFFICULTY_DISTRIBUTION = {
  easy: 150,    // 30%
  medium: 200,  // 40%
  hard: 100,    // 20%
  expert: 50    // 10%
};

class ProblemBankGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../database/generated_problems');
    this.totalProblems = 0;
  }

  async initialize() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    } catch (error) {
      console.error('Failed to create output directory:', error);
      throw error;
    }
  }

  async generateProblemsForBranch(branch) {
    console.log(`\n🧮 Generating problems for ${branch.toUpperCase()}...`);
    const branchProblems = [];
    let problemCount = 0;

    for (const difficulty of DIFFICULTIES) {
      const countForDifficulty = DIFFICULTY_DISTRIBUTION[difficulty];
      console.log(`  📊 Generating ${countForDifficulty} ${difficulty} problems...`);

      // Generate problems in batches to avoid memory issues
      const batchSize = 25;
      let generatedForDifficulty = 0;

      while (generatedForDifficulty < countForDifficulty) {
        const remainingCount = countForDifficulty - generatedForDifficulty;
        const currentBatchSize = Math.min(batchSize, remainingCount);

        try {
          const batchProblems = await aiGenerator.generateProblem(branch, difficulty, currentBatchSize);
          
          // Add batch metadata
          batchProblems.forEach((problem, index) => {
            problem.id = `${branch.toUpperCase()}_${difficulty.toUpperCase()}_${String(generatedForDifficulty + index + 1).padStart(3, '0')}`;
            problem.batch_generated = true;
            problem.generation_timestamp = new Date().toISOString();
          });

          branchProblems.push(...batchProblems);
          generatedForDifficulty += batchProblems.length;
          problemCount += batchProblems.length;

          // Progress indicator
          const progress = Math.round((generatedForDifficulty / countForDifficulty) * 100);
          process.stdout.write(`    ${difficulty}: ${generatedForDifficulty}/${countForDifficulty} (${progress}%)\r`);

        } catch (error) {
          console.error(`    ❌ Error generating ${difficulty} batch:`, error.message);
          // Continue with next batch
          continue;
        }
      }
      
      console.log(`    ✅ ${difficulty}: ${generatedForDifficulty}/${countForDifficulty} completed`);
    }

    console.log(`  🎉 Total problems generated for ${branch}: ${problemCount}`);
    return branchProblems;
  }

  async saveProblemsToFile(branch, problems) {
    const filename = `${branch}_problems.json`;
    const filepath = path.join(this.outputDir, filename);

    const metadata = {
      branch: branch,
      total_problems: problems.length,
      difficulty_breakdown: this.getDifficultyBreakdown(problems),
      generated_at: new Date().toISOString(),
      generator_version: '1.0.0',
      distribution: DIFFICULTY_DISTRIBUTION
    };

    const fileContent = {
      metadata: metadata,
      problems: problems
    };

    try {
      await fs.writeFile(filepath, JSON.stringify(fileContent, null, 2));
      console.log(`💾 Saved ${problems.length} problems to ${filepath}`);
      
      // Also create a summary file
      const summaryFile = path.join(this.outputDir, `${branch}_summary.json`);
      await fs.writeFile(summaryFile, JSON.stringify(metadata, null, 2));
      
      return filepath;
    } catch (error) {
      console.error(`❌ Failed to save problems for ${branch}:`, error);
      throw error;
    }
  }

  getDifficultyBreakdown(problems) {
    const breakdown = {};
    problems.forEach(problem => {
      const difficulty = problem.difficulty.toLowerCase();
      breakdown[difficulty] = (breakdown[difficulty] || 0) + 1;
    });
    return breakdown;
  }

  async generateAllProblems() {
    console.log('🚀 Starting BrainVault Problem Bank Generation...');
    console.log(`📊 Target: ${PROBLEMS_PER_BRANCH} problems per branch`);
    console.log(`🌿 Branches: ${BRANCHES.join(', ')}`);
    console.log(`📈 Difficulty distribution:`, DIFFICULTY_DISTRIBUTION);

    const startTime = Date.now();
    const results = {};

    for (const branch of BRANCHES) {
      try {
        const branchStartTime = Date.now();
        const problems = await this.generateProblemsForBranch(branch);
        await this.saveProblemsToFile(branch, problems);
        
        const branchEndTime = Date.now();
        const branchTime = Math.round((branchEndTime - branchStartTime) / 1000);
        
        results[branch] = {
          success: true,
          count: problems.length,
          time_seconds: branchTime
        };

        this.totalProblems += problems.length;
        console.log(`⏱️  Branch ${branch} completed in ${branchTime}s\n`);

      } catch (error) {
        console.error(`💥 Failed to generate problems for ${branch}:`, error);
        results[branch] = {
          success: false,
          error: error.message,
          count: 0
        };
      }
    }

    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);

    // Generate summary report
    await this.generateSummaryReport(results, totalTime);

    console.log('\n🎉 GENERATION COMPLETE!');
    console.log(`📊 Total problems generated: ${this.totalProblems}`);
    console.log(`⏱️  Total time: ${totalTime} seconds (${Math.round(totalTime/60)} minutes)`);
    
    return results;
  }

  async generateSummaryReport(results, totalTime) {
    const report = {
      generation_summary: {
        timestamp: new Date().toISOString(),
        total_problems: this.totalProblems,
        total_time_seconds: totalTime,
        target_per_branch: PROBLEMS_PER_BRANCH,
        branches: BRANCHES.length,
        success_rate: Object.values(results).filter(r => r.success).length / BRANCHES.length * 100
      },
      branch_results: results,
      configuration: {
        problems_per_branch: PROBLEMS_PER_BRANCH,
        difficulty_distribution: DIFFICULTY_DISTRIBUTION,
        branches: BRANCHES
      },
      file_locations: BRANCHES.map(branch => ({
        branch: branch,
        problems_file: `${branch}_problems.json`,
        summary_file: `${branch}_summary.json`
      }))
    };

    const reportPath = path.join(this.outputDir, 'generation_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Generation report saved to ${reportPath}`);
  }

  async validateGeneratedProblems() {
    console.log('\n🔍 Validating generated problems...');
    let totalValidated = 0;
    let totalErrors = 0;

    for (const branch of BRANCHES) {
      const filepath = path.join(this.outputDir, `${branch}_problems.json`);
      
      try {
        const fileContent = await fs.readFile(filepath, 'utf8');
        const data = JSON.parse(fileContent);
        const problems = data.problems;

        console.log(`  🔍 Validating ${branch}: ${problems.length} problems`);

        let branchErrors = 0;
        problems.forEach((problem, index) => {
          // Basic validation
          if (!problem.id || !problem.question || !problem.answer) {
            console.log(`    ⚠️  Problem ${index + 1}: Missing required fields`);
            branchErrors++;
          }
          
          if (!problem.given || Object.keys(problem.given).length === 0) {
            console.log(`    ⚠️  Problem ${index + 1}: No given values`);
            branchErrors++;
          }

          if (!problem.hints || problem.hints.length === 0) {
            console.log(`    ⚠️  Problem ${index + 1}: No hints provided`);
            branchErrors++;
          }
        });

        totalValidated += problems.length;
        totalErrors += branchErrors;
        
        if (branchErrors === 0) {
          console.log(`    ✅ ${branch}: All problems valid`);
        } else {
          console.log(`    ❌ ${branch}: ${branchErrors} problems have issues`);
        }

      } catch (error) {
        console.error(`    💥 Failed to validate ${branch}:`, error.message);
      }
    }

    console.log(`\n📊 Validation Summary:`);
    console.log(`  📈 Total problems validated: ${totalValidated}`);
    console.log(`  ⚠️  Total issues found: ${totalErrors}`);
    console.log(`  ✅ Success rate: ${((totalValidated - totalErrors) / totalValidated * 100).toFixed(1)}%`);
  }
}

// CLI execution
async function main() {
  const generator = new ProblemBankGenerator();
  
  try {
    await generator.initialize();
    const results = await generator.generateAllProblems();
    await generator.validateGeneratedProblems();
    
    console.log('\n🎊 Problem bank generation completed successfully!');
    console.log('📂 Files are saved in:', generator.outputDir);
    
  } catch (error) {
    console.error('💥 Generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ProblemBankGenerator;