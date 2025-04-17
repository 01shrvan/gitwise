import chalk from 'chalk';
import type { CommitStats } from './git-service';

export async function visualizeCommits(stats: CommitStats): Promise<void> {
  console.log('\n' + chalk.bold.cyan('📊 Commit Activity') + '\n');
  
  // Visualize commits by day
  console.log(chalk.bold('Commits by Day:'));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxDayCommits = Math.max(...Object.values(stats.commitsByDay));
  
  days.forEach(day => {
    const count = stats.commitsByDay[day] || 0;
    const barLength = maxDayCommits > 0 
      ? Math.round((count / maxDayCommits) * 20) 
      : 0;
    const bar = '█'.repeat(barLength);
    const dayStr = day.padEnd(9, ' ');
    
    console.log(`${dayStr} ${chalk.green(bar)} ${count}`);
  });
  
  console.log('\n' + chalk.bold('Commits by Hour:'));
  // Group hours into 4-hour blocks for a cleaner visualization
  const hourGroups = [
    { name: '00-05', hours: ['0', '1', '2', '3', '4', '5'] },
    { name: '06-11', hours: ['6', '7', '8', '9', '10', '11'] },
    { name: '12-17', hours: ['12', '13', '14', '15', '16', '17'] },
    { name: '18-23', hours: ['18', '19', '20', '21', '22', '23'] },
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
      ? Math.round((hourGroup.count / maxHourGroupCommits) * 20) 
      : 0;
    const bar = '█'.repeat(barLength);
    const hourStr = hourGroup.name.padEnd(5, ' ');
    
    console.log(`${hourStr} ${chalk.blue(bar)} ${hourGroup.count}`);
  });
  
  console.log('\n');
}