import React from 'react';
import { AssociationRule } from '../../types/dashboardData';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Typography } from '@mui/material'; // Using MUI for a styled table

interface AssociationRulesTableProps {
  data: AssociationRule[];
}

const AssociationRulesTable: React.FC<AssociationRulesTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography variant="body2" sx={{ color: '#cbd5e1' }}>No association rules found with the current settings.</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 440, backgroundColor: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(103, 232, 249, 0.18)', borderRadius: 3, boxShadow: '0 14px 44px rgba(2, 6, 23, 0.28)' }}> {/* Add max height for scroll */}
      <Table stickyHeader aria-label="association rules table">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: 'rgba(8, 47, 73, 0.95)', color: '#cffafe', borderBottom: '1px solid rgba(103, 232, 249, 0.18)' } }}>
            <TableCell>
              <Tooltip title="The item(s) bought before the consequent item(s).">
                <span>Antecedents (If...)</span>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Tooltip title="The item(s) likely bought after the antecedent item(s).">
                <span>Consequents (...Then)</span>
              </Tooltip>
            </TableCell>
            <TableCell align="right">
              <Tooltip title="How frequently the antecedent and consequent appear together in all transactions.">
                <span>Support</span>
              </Tooltip>
            </TableCell>
            <TableCell align="right">
              <Tooltip title="How often the consequent is bought given the antecedent was bought. (P(Consequent|Antecedent))">
                <span>Confidence</span>
              </Tooltip>
            </TableCell>
            <TableCell align="right">
              <Tooltip title="How much more likely the consequent is bought when the antecedent is bought, compared to its general popularity. (Lift > 1 suggests association).">
                <span>Lift</span>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((rule, index) => (
            <TableRow key={index} hover sx={{ '& td, & th': { color: '#cbd5e1', borderBottom: '1px solid rgba(103, 232, 249, 0.1)' }, '&:hover td, &:hover th': { backgroundColor: 'rgba(34, 211, 238, 0.1)' }, '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row" sx={{ color: '#f8fafc !important', fontWeight: 700 }}>
                {rule.antecedents}
              </TableCell>
              <TableCell>{rule.consequents}</TableCell>
              <TableCell align="right">{rule.support.toFixed(4)}</TableCell>
              <TableCell align="right">{rule.confidence.toFixed(4)}</TableCell>
              <TableCell align="right">{rule.lift.toFixed(4)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AssociationRulesTable; 
