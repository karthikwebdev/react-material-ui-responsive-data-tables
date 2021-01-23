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
import { Autocomplete, Pagination } from '@material-ui/lab';
import TruncatedText from "./TruncatedText"
import { Box, Chip, Collapse, FormControlLabel, IconButton, Switch, TextField } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import equal from "fast-deep-equal";
import makeNestedObject from './nestedObject';
import GroupData from './GroupData';


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

export default function GroupByTable() {
    const classes = useStyles();
    const { width } = useWindowDimensions();
    const [rows, setRows] = useState<RowData[]>([]);
    const [columns, setColumns] = useState<Column[]>([
        { id: 'orderId', label: 'OrderId' },
        { id: 'name', label: 'Name', },
        { id: 'amount', label: 'Amount', isNumeric: true, render: (value) => <span style={{ color: "#009BE5" }}>US${value} </span> },
        {
            id: 'date',
            label: 'Date',
            align: 'right',
        },
        {
            id: "address",
            label: 'Address',
            minWidth: 50,
            maxWidth: 100,
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
            secondParameter: {
                Danger: "#E21717",
                Pending: "#207398",
                Success: "#3DBE29",
                Cancelled: "#758283",
                Info: "#E07C24",
            },
            render: (value, colors) => <Chip label={value} style={{
                backgroundColor: colors ? colors[value] : "",
                color: "white"
            }} size="small" />
        },
        {
            id: "type",
            label: 'Type',
            align: 'center',
            secondParameter: {
                "Online": "#3DBE29",
                "Retail": "#E07C24",
                "Direct": "#758283"
            },
            render: (value, colors) => (<span
                style={{ color: colors[value] }}
            >
                {value}
            </span>)
        },
    ])
    const [rowsAfterFiltered, setRowsAfterFiltered] = useState<RowData[]>([]);
    const [rowsAfterGrouped, setRowsAfterGrouped] = useState<RowData[]>([]);
    const [columnsForMapping, setColumnsForMapping] = useState<Column[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");
    const [groupByHeaders, setGroupByHeaders] = useState<Column[]>([]);
    const [isGroupingEnabled, setIsGroupingEnabled] = useState<boolean>(false);
    const [isExpandAllEnabled, setIsExpandAllEnabled] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setRows(fakeJsonGenerator(100))
    },[])

    useEffect(() => {
        if(searchValue.trim()){
            setRowsAfterFiltered(rows.filter(row => doesSearchValueExists(row, searchValue)))
        }else{
            setRowsAfterFiltered(rows);
        }
    },[searchValue,rows])

    useEffect(() => {
        if(isGroupingEnabled){
             setRowsAfterGrouped(makeNestedObject(groupByHeaders.map(column => column.id),0,rowsAfterFiltered));
        }
    }, [isGroupingEnabled,groupByHeaders,rowsAfterFiltered])

    useEffect(() => {
        if(groupByHeaders.length){
            setIsGroupingEnabled(true)
            let newColumns = [...groupByHeaders];
            columns.forEach(column=> {
                let isAlreadyIncluded = false
                for(let selectedColumn of newColumns){
                    if(equal(column,selectedColumn)){
                        isAlreadyIncluded = true
                        break
                    }
                }
                if(!isAlreadyIncluded){
                    newColumns.push(column)
                }
            })
            setColumnsForMapping(newColumns);
        } else {
        setIsGroupingEnabled(false)
        setColumnsForMapping(columns);
        }
    }, [groupByHeaders,columns])

    return (
        <Paper className={classes.root} style={{
                width: width < 600 ?"98%" :undefined 
            }} 
        >
            <div style={{ padding: "20px", display: "flex", flexDirection: width < 700 ? "column" : "row"}}>
                <Autocomplete
                    multiple
                    id="headers-autocomplete"
                    style={{
                        width: width < 700 ? "100%" : "80%",
                        margin: width < 700 ? "5px" : "10px"
                    }}
                    value={groupByHeaders}
                    onChange={(e,v) => {
                        setGroupByHeaders(v);
                    }}
                    limitTags={3}
                    options={columns}
                    getOptionLabel={(option:Column) => option.label}
                    filterSelectedOptions
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            label="Group By Headers"
                            placeholder="Select Header"
                        />
                    )}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                            variant="outlined"
                            color="primary"
                            label={option.label}
                                {...getTagProps({ index })}
                            />
                        ))
                    }
                />
                <TextField style={{ width: width < 700 ? "100%" : "20%", margin: width < 700 ? "5px" : "10px" }} id="Search-Bar" label="Search" variant="outlined" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
            </div>
            <div
                style={{
                    height:"50px"
                }}
            >
                {
                    isGroupingEnabled ? (
                        <FormControlLabel
                            style={{
                                padding: "0 30px"
                            }}
                            control={<Switch checked={isExpandAllEnabled} onChange={() => setIsExpandAllEnabled(prev => !prev)} name="checkedA" />}
                            label="Expand All"
                        />
                    ) : ""
                }
            </div>
            <TableContainer >
                <Table aria-label="Data table">
                    <TableHead>
                        <TableRow >
                            {
                                isGroupingEnabled ? "" : (
                                    <TableCell
                                        align={"left"}
                                        style={{
                                            backgroundColor: "#009be5",
                                            color: "white"
                                        }}
                                    >
                                        #
                                    </TableCell>
                                )
                            }
                            
                            {columnsForMapping.map((column,i) => (
                                <>
                                {
                                    (i+1)*150 < width ? (
                                            <TableCell
                                                key={column.id}
                                                align={isGroupingEnabled ? "left" : column.align ? column.align : "center"}
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
                        <>
                            {
                                !isGroupingEnabled ? (
                                    <>
                                    {
                                        rowsAfterFiltered.map(
                                            (row, i) =>
                                                <Row row={row} key={i} columns={columnsForMapping} />
                                        )
                                    }  
                                    </>
                                ) : (
                                    <TableCell colSpan={columns.length+1} >
                                        <GroupData data={rowsAfterGrouped} columns={columnsForMapping} index={0} isExpandAllEnabled={isExpandAllEnabled} />     
                                    </TableCell>
                                )
                            }
                        </>
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
