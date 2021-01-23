import React, { ReactNode, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import fakeJsonGenerator from '../utils/fakeJsonGenerator';
import useWindowDimensions from '../utils/useWindowDimensions';
import { Pagination } from '@material-ui/lab';
import TruncatedText from "./TruncatedText"
import { Box, Chip, Collapse, FormControl, IconButton, InputLabel, MenuItem, Select, TextField } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';


interface Column {
    id: keyof RowData;
    label: string;
    align?: "right" | "left" | "center" | "inherit" | "justify" | undefined
    minWidth?:number,
    maxWidth?:number,
    isNumeric?:boolean,
    secondParameter?:any,
    render?:(value: string | number,secondParameter?:any) => ReactNode
}

interface RowData {
    orderId: string,
    name: string,
    amount:number,
    country: string,
    type: string,
    status: string,
    address: string,
    date: string,
}

const columns: Column[] = [
    { id: 'orderId', label: 'OrderId' },
    { id: 'name', label: 'Name', },
    { id: 'amount', label: 'Amount',isNumeric:true,render:(value) =><span style={{color:"#009BE5"}}>US${value} </span> },
    {
        id: 'date',
        label: 'Date',  
        align: 'right',
    },
    {
        id: "address",
        label: 'Address',
        minWidth:50,
        maxWidth:100,
        align: 'left',
        render: (value) => typeof value === "string" && value.length > 40 ? <TruncatedText text={value} /> : value
     },
    {
        id: "country",
        label: 'Country',
        align: 'left',
    },
    {
        id: "status",
        label: 'Status', 
        align: 'center',
        secondParameter:{
            Danger:"#E21717",
            Pending:"#207398",
            Success:"#3DBE29",
            Cancelled:"#758283",
            Info:"#E07C24",
        },
        render: (value,colors) => <Chip label={value} style={{
            backgroundColor:colors ? colors[value] : "",
            color:"white"
        }} size="small" />
    },
    {
        id: "type",
        label: 'Type',      
        align: 'center',
        secondParameter:{
            "Online":"#3DBE29",
            "Retail":"#E07C24",
            "Direct":"#758283"
        },
        render: (value, colors) => (<span
            style={{color:colors[value]}}
        >
           {value}
        </span>)
    },
];

const useStyles = makeStyles({
    root: {
        width: '80%',
        margin:"40px auto"
    },
    container: {
        maxHeight: 440,
    },
});

function Row(props: { row: RowData,columns:Column[] }) {
    const { row,columns } = props;
    const [open, setOpen] = React.useState(false);
    const { width } = useWindowDimensions();

    return (
        <React.Fragment>
            <TableRow hover role="checkbox" tabIndex={-1} key={row.orderId}>
                <TableCell>
                    {
                        columns.length*150 > width ? (
                            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                                {open ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                            </IconButton>
                        ) : ""
                    }
                </TableCell>
                {columns.map((column,i) => {
                    const value = row[column.id];
                    return (
                        (i+1)*150 <width ?
                        <TableCell key={column.id} align={column.align}>
                            {
                                    !!column.render ? column.render(value, column.secondParameter ? column.secondParameter : undefined) : value
                            }
                        </TableCell> : ""
                    );
                })}
            </TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={Math.floor((columns.length/2) +1)}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box>
                        <Table size="small" aria-label="purchases" >                 
                            <TableBody>
                                    {columns.map((column,i) => {
                                        const value = row[column.id];
                                        return (
                                            (i+1)*150 >= width ? (
                                                <TableRow key={column.id} >
                                                    <TableCell>
                                                        {column.label}
                                                    </TableCell>
                                                    <TableCell align={"left"}>
                                                        {
                                                            typeof value === "string" && value.length > 40 ? <TruncatedText text={value} /> : !!column.render ? column.render(value, column.secondParameter ? column.secondParameter : undefined) : value
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            ) : ""
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </Box>
                </Collapse>
            </TableCell>
        </React.Fragment>
    );
}

const doesSearchValueExists = (row:RowData, searchValue:string) => {
    let rowItems = Object.values(row).map(item => item.toString());
    const regex = new RegExp(searchValue.toString(), 'gi')
    return rowItems.some(e => typeof e === "string" && e.match(regex))       
}

export default function ResponsiveTable() {
    const classes = useStyles();
    const { width } = useWindowDimensions();
    const [page, setPage] = React.useState(1);
    const [rowsPerPage] = React.useState(10);
    const [rows, setRows] = useState<RowData[]>([]);
    const [rowsAfterFiltered, setRowsAfterFiltered] = useState<RowData[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");
    const [status, setStatus] = useState("All");
    const [type, setType] = useState("All");

    useEffect(() => {
        setRows(fakeJsonGenerator(35))
    },[])

    useEffect(() => {
        if(searchValue.trim()){
            setPage(1)
            setRowsAfterFiltered(
                rows.filter(row => 
                    (status === "All" || row["status"] === status) && 
                    (type === "All" || row["type"] === type) &&
                    doesSearchValueExists(row, searchValue)                            
                ))
        }else{
            setPage(1)
            setRowsAfterFiltered(
                (prev:RowData[]):RowData[] => 
                    rows.filter(row => 
                        (status === "All" || row["status"] === status) && 
                        (type === "All" || row["type"] === type)
                        )
    )}},[searchValue,rows,type,status])

    return (
        <Paper className={classes.root} style={{
                width: width < 600 ?"98%" :undefined 
            }} 
        >
            <div style={{padding: "10px"}}>
                <TextField style={{ width:width < 700 ? "100%" : "20%" }} id="Search-Bar" label="Search" variant="outlined" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
                <FormControl style={{ width: width < 700 ? "100%" : "20%", margin: width < 700 ?  "10px 0" : "0 10px",boxSizing:"border-box" }} variant="outlined" >
                    <InputLabel id="status-select-label"> Status: </InputLabel>
                    <Select
                        labelId="status-select-label"
                        id="status-select"
                        value={status}
                        onChange={(e:any) => setStatus(e.target.value)}
                        label="Status:"
                    >
                        
                        <MenuItem value={"All"}>All</MenuItem>
                        {[
                            "Pending",
                            "Success",
                            "Cancelled",
                            "Info",
                            "Danger",
                        ].map((item:string,i:number) => <MenuItem key={i} value={item}>{item}</MenuItem>)}
                        
                    </Select>
                </FormControl>
                <FormControl style={{ width: width < 700 ? "100%" : "20%", margin: width < 700 ? "10px 0" : "0 10px", boxSizing: "border-box" }} variant="outlined" >
                    <InputLabel id="Type-select-label"> Type: </InputLabel>
                    <Select
                        labelId="Type-select-label"
                        id="Type-select"
                        value={type}
                        onChange={(e: any) => setType(e.target.value)}
                        label="Type:"
                    >

                        <MenuItem value={"All"}>All</MenuItem>
                        {[
                            "Retail",
                            "Online",
                            "Direct"
                        ].map((item: string, i: number) => <MenuItem key={i} value={item}>{item}</MenuItem>)}

                    </Select>
                </FormControl>
            </div>
            <TableContainer className={classes.container}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow >
                            <TableCell
                                align={"left"}
                                style={{
                                    backgroundColor: "#009be5",
                                    color: "white"
                                }}
                            >
                                #
                            </TableCell>
                            {columns.map((column,i) => (
                                <>
                                {
                                    (i+1)*150 < width ? (
                                            <TableCell
                                                key={column.id}
                                                align={column.align}
                                                style={{
                                                    minWidth: column.minWidth,
                                                    maxWidth: column.maxWidth,
                                                    backgroundColor: "#009be5",
                                                    color: "white"
                                                }}
                                            >
                                                {column.label}
                                            </TableCell>
                                    ) : ""
                                }
                                
                                </>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            rowsAfterFiltered.slice((page-1) * rowsPerPage, page * rowsPerPage).map((row,i) => {
                                    return (
                                        <Row row={row} key={i} columns={columns} />
                                    );
                                })
                            
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            <div 
                style={{
                    padding:"20px"
                }}
            >
                <Pagination page={page} count={Math.ceil((rowsAfterFiltered.length) / rowsPerPage)} onChange={(e, p) => {
                    setPage(p)
                }} showFirstButton={width > 400} showLastButton={width > 400} variant="text" color="primary" shape="rounded" />
            </div>            
        </Paper>
    );
}
