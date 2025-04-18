import chalk from 'chalk';
import { CommitStats } from '../types';

export function visualizeCommits(stats: CommitStats): void {
  console.log('\n' + chalk.bold.cyan('📊 Commit Activity') + '\n');
  
  // Visualize commits by day
  console.log(chalk.bold('Commits by Day:'));
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const maxDayCommits = Math.max(...Object.values(stats.commitsByDay));
  
  days.forEach(day => {
    const count = stats.commitsByDay[day] || 0;
    const barLength = maxDayCommits > 0 
      ? Math.round((count / maxDayCommits) * 15) 
      : 0;
    const bar = '█'.repeat(barLength);
    const dayStr = day.padEnd(9, ' ');
    
    const percentage = maxDayCommits > 0
      ? Math.round((count / stats.total) * 100)
      : 0;
    
    const displayCount = `${count} (${percentage}%)`.padStart(10);
    console.log(`${dayStr} ${chalk.green(bar)} ${displayCount}`);
  });
  
  console.log('\n' + chalk.bold('Commits by Time:'));
  // Use more meaningful time blocks
  const hourGroups = [
    { name: 'Morning (6-11)', hours: ['6', '7', '8', '9', '10', '11'] },
    { name: 'Afternoon (12-17)', hours: ['12', '13', '14', '15', '16', '17'] },
    { name: 'Evening (18-23)', hours: ['18', '19', '20', '21', '22', '23'] },
    { name: 'Night (0-5)', hours: ['0', '1', '2', '3', '4', '5'] },
  ];
  
  const hourCounts = hourGroups.map(group => {
    return {
      name: group.name,
      count: group.hours.reduce((sum, hour) => sum + (stats.commitsByHour[hour] || 0), 0)
    };
  });
  
  const maxHourGroupCommits = Math.max(...hourCounts.map(h => h.count));
  
  hourCounts.forEach(hourGroup => {
    const barLength = maxHourGroupCommits > 0 
      ? Math.round((hourGroup.count / maxHourGroupCommits) * 15) 
      : 0;
    const bar = '█'.repeat(barLength);
    const hourStr = hourGroup.name.padEnd(16, ' ');
    
    const percentage = stats.total > 0
      ? Math.round((hourGroup.count / stats.total) * 100)
      : 0;
    
    const displayCount = `${hourGroup.count} (${percentage}%)`.padStart(10);
    console.log(`${hourStr} ${chalk.blue(bar)} ${displayCount}`);
  });
  
  console.log('\n');
}

export function printInsightsHighlight(insights: string): void {
  const highlightBox = (content: string): void => {
    const lines = content.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    
    console.log(chalk.yellow('┌' + '─'.repeat(maxLength + 2) + '┐'));
    
    lines.forEach(line => {
      console.log(chalk.yellow('│ ') + line.padEnd(maxLength) + chalk.yellow(' │'));
    });
    
    console.log(chalk.yellow('└' + '─'.repeat(maxLength + 2) + '┘'));
  };
  
  console.log('\n' + chalk.bold.green('🧠 Key Insights') + '\n');
  highlightBox(insights);
  console.log('\n');
}