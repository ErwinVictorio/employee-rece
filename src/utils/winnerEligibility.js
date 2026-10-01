export function eligibleEmployees(employees, winnerIds, exclude) {
  return exclude ? employees.filter(employee => !winnerIds.includes(employee.id)) : employees;
}

export function recordWinner(winnerIds, winnerId) {
  return winnerIds.includes(winnerId) ? winnerIds : [...winnerIds, winnerId];
}
