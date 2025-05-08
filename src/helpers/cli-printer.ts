import chalk from 'chalk';
import figlet from 'figlet';
import Table from 'cli-table3';

const colors = {
    coral: '#eb5b5d',
    info: '#00bfff',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
};

export const printTitle = (title: string) => {
    console.log(chalk.hex(colors.coral).bold(
        figlet.textSync(title, {
            horizontalLayout: 'default',
            verticalLayout: 'default',
        })))
}

export const printInfo = (message: string) =>
    console.log(chalk.hex(colors.info)(message));

export const printSuccess = (message: string) =>
    console.log(chalk.hex(colors.success).bold(message));

export const printWarning = (message: string) =>
    console.log(chalk.hex(colors.warning).italic(message));

export const printError = (message: string) =>
    console.log(chalk.hex(colors.error).bold.inverse(message));

export const printTable = ({headers, widths, rows}: {headers: string[], widths: number[], rows: string[][]}) => {
    const table = new Table({
        head: headers,
        colWidths: widths,
    });
    rows.forEach((row) => table.push(row));
    console.log(table.toString());
};