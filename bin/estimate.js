#! /usr/local/bin/node

//
// ─── IMPORTS ────────────────────────────────────────────────────────────────────
//

    const fs =
        require('fs')
    const path =
        require('path')

//
// ─── MAIN ───────────────────────────────────────────────────────────────────────
//

    main( ); function main ( ) {
        const fileName =
            getCommandLineArguments( )
        const sheet =
            loadSheet( fileName )
        const developerCostTable =
            require( path.join( fileName, 'monthly-salary.json' ) )
        const estimates =
            computeEstimates( sheet, developerCostTable )


        console.log( )
        console.log( "Total Cost:\t", estimates.cost, "\tTomans" )
        console.log( "Developer/Days:\t", estimates.days, "\t\tDays" )
        console.log( "Total Time:\t", estimates.time, "\t\tDays" )
    }

//
// ─── GETTING COMMAND LINE STUFF ─────────────────────────────────────────────────
//

    function getCommandLineArguments ( ) {
        if ( process.argv.length > 2 ) {
            return path.join( process.cwd( ), process.argv[ 2 ] )
        } else {
            return null
        }
    }

//
// ─── COMPUTE ESTIMATES ──────────────────────────────────────────────────────────
//

    function computeEstimates ( sheet, developerCostTable ) {
        const time_estimate =
            estimateTime( sheet )
        const cost_estimate =
            estimateTotalCost( sheet, time_estimate, developerCostTable )
        const developerDays
            = estimateDeveloperDays( sheet )

        return {
            cost:   cost_estimate,
            time:   time_estimate,
            days:   developerDays
        }
    }

//
// ─── ESTIMATE DEVELOPER DAYS ────────────────────────────────────────────────────
//

    function estimateDeveloperDays ( sheet ) {
        return sheet.map( row => row.taskTime ).reduce( ( sum, time ) => sum + time )
    }

//
// ─── ESTIMATE TIME ──────────────────────────────────────────────────────────────
//

    function estimateTime ( sheet ) {
        const maxPhase =
            Math.max( ...sheet.map( row => row.phase ) )
        let timeSum =
            0

        for ( let counter = 1; counter <= maxPhase; counter++ ) {
            const phaseRows =
                sheet.filter( row => row.phase === counter )

            timeSum += estimatePhaseTime( phaseRows )
        }

        return timeSum
    }

//
// ─── ESTIMATE PHASE TIME ────────────────────────────────────────────────────────
//

    function estimatePhaseTime ( phaseRows ) {
        const timeSumOfAssignees = { }

        for ( const row of phaseRows )
            timeSumOfAssignees[ row.assignee ] =
                row.taskTime + ( timeSumOfAssignees[ row.assignee ] | 0 )

        const phaseTimeSum =
            Math.max( ...Object.keys( timeSumOfAssignees )
                               .map( key => timeSumOfAssignees[ key ] ) )

        return phaseTimeSum
    }

//
// ─── ESTIMATE COST ──────────────────────────────────────────────────────────────
//

    function estimateTotalCost ( sheet, time_estimate, developerCostTable ) {
        const developersCost =
            sheet.map( row => computeSingleTaskCost( row, developerCostTable ) )
                 .reduce( ( sum, cost ) => sum + cost )
        const managementCost =
            estimateManagementCost( time_estimate, developerCostTable )
        const totalCost =
            developersCost + managementCost

        return formatInTomans( totalCost )
    }

//
// ─── MANAGEMENT COST ────────────────────────────────────────────────────────────
//

    function estimateManagementCost ( time_estimate, developerCostTable ) {
        return ( time_estimate / 30 ) * developerCostTable[ "Management" ]
    }

//
// ─── COMPUTE SINGLE TASK COST ───────────────────────────────────────────────────
//

    function computeSingleTaskCost ( task, developerCostTable ) {
        return ( developerCostTable[ task.engineerType ] / 24 ) * task.taskTime
    }

//
// ─── LOAD DATA ──────────────────────────────────────────────────────────────────
//

    function loadSheet ( fileName ) {
        const sheetPath =
            path.join( fileName, "tasks.table" )
        const sheetPlainText =
            fs.readFileSync( sheetPath, "utf8" )

        function formatRow ( rowString ) {
            const columnsString =
                rowString.replace( /^(?:\s)*\-/, "" )
                         .split( "|" )
                         .map( x => x.trim( ) )

            return {
                name:                     columnsString[ 0 ],
                taskTime:       parseInt( columnsString[ 1 ] ),
                engineerType:             columnsString[ 2 ],
                phase:          parseInt( columnsString[ 3 ] ),
                assignee:                 columnsString[ 4 ],
            }
        }

        return sheetPlainText
            .split( "\n" )
            .filter( row => row.startsWith( "-" ) )
            .map( row => formatRow( row ) )
    }

//
// ─── FORMAT NUMBER ──────────────────────────────────────────────────────────────
//

    function formatInTomans ( x ) {
        const base =
            Math.floor( x )
        const formattedBase =
            base.toString( )
                .replace( /\B(?=(\d{3})+(?!\d))/g, "," )
        return formattedBase
    }

// ────────────────────────────────────────────────────────────────────────────────
