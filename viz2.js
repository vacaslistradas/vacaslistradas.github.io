function convertToLocalTime2(utcDate, venue) {
    const venueRow = venue_data.find(v => v.Venue === venue);
    if (!venueRow || !venueRow.Tstring) {
        console.error(`No timezone found for venue: ${venue}`);
        return null;
    }

    try {

        const cleanDate = utcDate.replace(" UTC", "").trim();
        const isoString = cleanDate.replace(" ", "T") + "Z";

        const utcDateTime = new Date(isoString);

        if (isNaN(utcDateTime.getTime())) {
            console.error(`Invalid date created from: ${utcDate}`);
            return null;
        }

        const options = {
            timeZone: venueRow.Tstring,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        const localDateTime = utcDateTime.toLocaleString('en-US', options);

        return localDateTime.replace(',', '') + ' ' + venueRow.Tstring;

    } catch (e) {
        console.error(`Error converting time for venue ${venue}: ${e}`);
        console.error('Input date:', utcDate);
        console.error('Venue timezone:', venueRow?.Tstring);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    Promise.all([
        d3.csv('data2.csv'),
        d3.csv('Team_venue_info.csv'),
        fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(response => response.json()),
        fetch("https://gist.githubusercontent.com/Brideau/2391df60938462571ca9/raw/f5a1f3b47ff671eaf2fb7e7b798bacfc6962606a/canadaprovtopo.json").then(response => response.json())
    ]).then(([data2Raw, venue_dataRaw, us_topology, canada_topology]) => {
        window.venue_data = venue_dataRaw;
        
        const geography = {
            us: topojson.feature(us_topology, us_topology.objects.states),
            canada: topojson.feature(canada_topology, canada_topology.objects.canadaprov)
        };

        const data2 = data2Raw.map(row => ({
            ...row,
            durationMinutes: +row.durationMinutes,
            localStartTime: convertToLocalTime2(row.startTime, row.venueName)
        }));

        
        const width = 900;
        const height = 600;
        const graphHeight = 300;
        const margin = { top: 50, right: 50, bottom: 50, left: 70 };
        const mapPadding = 50;

        const container = d3.select("#viz2-container")
            .append("div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "20px");

        const timeData = new Map();
        const gameCountByTime = new Map();


        function getGameHourRange(startTimeStr, durationMinutes) {
            try {
                const timeParts = startTimeStr.split(" ")[1].split(":");
                const startHour = parseInt(timeParts[0], 10);

                if (isNaN(startHour)) {
                    console.error("Invalid start hour:", startTimeStr);
                    return [];
                }

                const numHours = Math.ceil(durationMinutes / 60);

                const activeHours = [];
                for (let i = 0; i < numHours; i++) {
                    activeHours.push((startHour + i) % 24);
                }
                return activeHours;
            } catch (e) {
                console.error("Error processing game time:", e);
                return [];
            }
        }

        data2.forEach((d, index) => {
            try {
                if (!d.localGameTime) return;

                const timeParts = d.localGameTime.split(" ")[1].split(":");
                const hour = parseInt(timeParts[0], 10);

                if (isNaN(hour)) {
                    console.log("Invalid hour:", d.localGameTime);
                    return;
                }

                if (!timeData.has(d.venueName)) {
                    timeData.set(d.venueName, new Map());
                }
                const venueMap = timeData.get(d.venueName);
                venueMap.set(hour, (venueMap.get(hour) || 0) + 1);

            } catch (e) {
                console.error(`Error processing home run at index ${index}:`, e);
                console.error("Data:", d);
            }
        });

        const processedGames = new Set();

        data2.forEach((d, index) => {
            try {
                if (processedGames.has(d.gameId)) return;
                processedGames.add(d.gameId);

                const localStartTime = convertToLocalTime2(d.startTime, d.venueName);
                if (!localStartTime || !d.durationMinutes) return;

                const activeHours = getGameHourRange(localStartTime, d.durationMinutes);

                if (!gameCountByTime.has(d.venueName)) {
                    gameCountByTime.set(d.venueName, new Map());
                }

                const venueGameMap = gameCountByTime.get(d.venueName);

                activeHours.forEach(hour => {
                    if (!venueGameMap.has(hour)) {
                        venueGameMap.set(hour, new Set());
                    }
                    venueGameMap.get(hour).add(d.gameId);
                });

            } catch (e) {
                console.error(`Error processing game at index ${index}:`, e);
                console.error("Data:", d);
            }
        });


        var homeRunsByVenue = d3.rollup(data2,
            v => v.length,
            d => d.venueName
        );

        var homeRunsByVenueDayNight = d3.rollup(data2,
            v => ({
                total: v.length,
                day: d3.sum(v, d => d.dayNight === 'D' ? 1 : 0),
                night: d3.sum(v, d => d.dayNight === 'N' ? 1 : 0)
            }),
            d => d.venueName
        );

        var mapData = Array.from(homeRunsByVenue, ([venueName, count]) => {
            const venueInfo = venue_data.find(v => v.Venue === venueName);
            const dayNightStats = homeRunsByVenueDayNight.get(venueName);
            return {
                venue: venueName,
                count: count,
                lat: venueInfo?.Lat,
                long: venueInfo?.Long,
                dayHRs: dayNightStats.day,
                nightHRs: dayNightStats.night,
                dayPct: (dayNightStats.day / count * 100).toFixed(1),
                nightPct: (dayNightStats.night / count * 100).toFixed(1)
            };
        });

        let activeJitterTimeout = null;
        let activeJitterGroup = new Set();

        function getOverlappingPoints(selectedPoint, allPoints, threshold = 20) {
            const [selectedX, selectedY] = projection([selectedPoint.long, selectedPoint.lat]);
            return allPoints.filter(point => {
                if (point === selectedPoint) return false;
                const [x, y] = projection([point.long, point.lat]);
                const dist = Math.sqrt(Math.pow(x - selectedX, 2) + Math.pow(y - selectedY, 2));
                return dist < threshold;
            });
        }

        function jitterPoint(point, index, centerPoint, radius = 20) {
            const [centerX, centerY] = projection([centerPoint.long, centerPoint.lat]);
            const spreadAngle = (20 * Math.PI) / 180;
            const baseAngle = Math.PI - spreadAngle / 2;
            const angle = baseAngle + (index * (spreadAngle / 8));

            let jitteredX = centerX + radius * Math.cos(angle);
            let jitteredY = centerY + radius * Math.sin(angle);

            const padding = 10;
            jitteredX = Math.max(padding, Math.min(width - padding, jitteredX));
            jitteredY = Math.max(padding, Math.min(height - padding, jitteredY));

            return [jitteredX, jitteredY];
        }

        const maxCount = d3.max(mapData, d => d.count);
        const minCount = d3.min(mapData, d => d.count);
        const sizeScale = d3.scaleSqrt()
            .domain([minCount, maxCount])
            .range([10, 300]);

        const bounds = {
            type: "MultiPoint",
            coordinates: [
                [-125, 25],
                [-70, 48]
            ]
        };

        const projection = d3.geoAlbers()
            .fitSize([width - (mapPadding * 2), height - (mapPadding * 2)], bounds);

        const mapSvg = container.append("svg")
            .attr("width", width + (mapPadding * 2))
            .attr("height", height + (mapPadding * 2))
            .style("background-color", "white");

        const mapGroup = mapSvg.append("g")
            .attr("transform", `translate(${mapPadding}, ${mapPadding})`);

        const graphOverlay = container.append("div")
            .style("position", "absolute")
            .style("top", "50%")
            .style("left", "50%")
            .style("transform", "translate(-50%, -50%)")
            .style("background-color", "white")
            .style("padding", "20px")
            .style("border-radius", "8px")
            .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)")
            .style("z-index", "1000")
            .style("display", "none")
            .style("max-width", "95%")
            .style("max-height", "95vh")
            .style("overflow", "auto");

        const closeButton = graphOverlay.append("div")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "10px")
            .style("cursor", "pointer")
            .style("font-size", "20px")
            .style("width", "30px")
            .style("height", "30px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("border-radius", "50%")
            .style("background-color", "#f0f0f0")
            .style("transition", "background-color 0.2s")
            .html("×")
            .on("mouseover", function () {
                d3.select(this).style("background-color", "#e0e0e0");
            })
            .on("mouseout", function () {
                d3.select(this).style("background-color", "#f0f0f0");
            })
            .on("click", hideGraph);

        const graphSvg = graphOverlay.append("svg")
            .attr("width", width)
            .attr("height", graphHeight + 40);

        const path = d3.geoPath(projection);

        const tooltip = d3.select(document.body)
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)")
            .style("pointer-events", "none")
            .style("z-index", "1100");

        mapGroup.append("path")
            .datum(geography.us)
            .attr("d", path)
            .attr("fill", "#f0f0f0")
            .attr("stroke", "#ccc");

        mapGroup.append("path")
            .datum(geography.canada)
            .attr("d", path)
            .attr("fill", "#f0f0f0")
            .attr("stroke", "#ccc");

        function hideGraph() {
            graphOverlay.style("display", "none");
        }

        function formatTime(decimal) {
            const hours = Math.floor(decimal);
            const minutes = Math.round((decimal - hours) * 60);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        }

        function updateTimeGraph(venueName) {
            graphOverlay.style("display", "block");
            graphSvg.selectAll("*").remove();

            const venueTimeMap = timeData.get(venueName);
            const venueGameMap = gameCountByTime.get(venueName);

            if (!venueTimeMap || !venueGameMap) {
                graphSvg.append("text")
                    .attr("x", width / 2)
                    .attr("y", graphHeight / 2)
                    .attr("text-anchor", "middle")
                    .text("No time data available for this venue");
                return;
            }

            const timeDistribution = Array.from(venueTimeMap, ([hour, hrCount]) => {
                const gamesInProgress = venueGameMap.get(Number(hour))?.size || 0;
                return {
                    hour: Number(hour),
                    count: hrCount,
                    games: gamesInProgress,
                    rate: gamesInProgress > 0 ? hrCount / gamesInProgress : 0
                };
            }).sort((a, b) => a.hour - b.hour);

            console.log("Time Distribution before filter:", timeDistribution);

            const validTimeDistribution = timeDistribution.filter(d =>
                !isNaN(d.hour) && d.hour >= 0 && d.hour <= 24 && !isNaN(d.rate)
            );

            if (validTimeDistribution.length === 0) {
                graphSvg.append("text")
                    .attr("x", width / 2)
                    .attr("y", graphHeight / 2)
                    .attr("text-anchor", "middle")
                    .text("No valid time data available for this venue");
                return;
            }

            const xScale = d3.scaleLinear()
                .domain([0, 24])
                .range([margin.left, width - margin.right]);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(validTimeDistribution, d => d.rate) * 1.1])
                .range([graphHeight - margin.bottom, margin.top]);

            graphSvg.append("g")
                .attr("class", "grid")
                .attr("transform", `translate(0,${graphHeight - margin.bottom})`)
                .call(d3.axisBottom(xScale)
                    .tickFormat("")
                    .tickSize(-graphHeight + margin.top + margin.bottom)
                    .ticks(12))
                .style("stroke-opacity", 0.1);

            graphSvg.append("g")
                .attr("class", "grid")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(yScale)
                    .tickFormat("")
                    .tickSize(-width + margin.left + margin.right)
                    .ticks(5))
                .style("stroke-opacity", 0.1);

            const line = d3.line()
                .x(d => xScale(d.hour))
                .y(d => yScale(d.rate))
                .curve(d3.curveMonotoneX);

            graphSvg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${graphHeight - margin.bottom})`)
                .call(d3.axisBottom(xScale)
                    .tickFormat(formatTime)
                    .ticks(12))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");

            graphSvg.append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(yScale)
                    .ticks(5)
                    .tickFormat(d => d.toFixed(2)));

            graphSvg.append("text")
                .attr("x", width / 2)
                .attr("y", graphHeight + 15)
                .attr("text-anchor", "middle")
                .text("Time of Day");

            graphSvg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -graphHeight / 2)
                .attr("y", margin.left / 2)
                .attr("text-anchor", "middle")
                .text("Home Runs per Game");

            graphSvg.append("text")
                .attr("x", width / 2)
                .attr("y", margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`Home Run Rate by Time of Day at ${venueName}`);

            graphSvg.append("path")
                .datum(validTimeDistribution)
                .attr("fill", "steelblue")
                .attr("fill-opacity", 0.1)
                .attr("stroke", "none")
                .attr("d", d3.area()
                    .x(d => xScale(d.hour))
                    .y0(graphHeight - margin.bottom)
                    .y1(d => yScale(d.rate))
                );

            graphSvg.append("path")
                .datum(validTimeDistribution)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("d", line);

            graphSvg.selectAll("circle")
                .data(validTimeDistribution)
                .join("circle")
                .attr("cx", d => xScale(d.hour))
                .attr("cy", d => yScale(d.rate))
                .attr("r", 5)
                .attr("fill", "steelblue")
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .on("mouseover", function (event, d) {
                    d3.select(this)
                        .attr("r", 7)
                        .attr("fill", "red");
                    tooltip
                        .style("visibility", "visible")
                        .html(`
              Time: ${formatTime(d.hour)}<br>
              Home Runs: ${d.count}<br>
              Games: ${d.games}<br>
              Rate: ${d.rate.toFixed(2)} HR/game
            `);
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .attr("r", 5)
                        .attr("fill", "steelblue");
                    tooltip
                        .style("visibility", "hidden");
                });
        }


        mapGroup.selectAll("circle")
            .data(mapData)
            .join("circle")
            .attr("cx", d => projection([d.long, d.lat])[0])
            .attr("cy", d => projection([d.long, d.lat])[1])
            .attr("r", d => Math.sqrt(sizeScale(d.count) / Math.PI))
            .attr("fill", "steelblue")
            .attr("fill-opacity", 0.6)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("data-original-x", d => projection([d.long, d.lat])[0])
            .attr("data-original-y", d => projection([d.long, d.lat])[1])
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                if (activeJitterTimeout) {
                    clearTimeout(activeJitterTimeout);
                    activeJitterTimeout = null;
                }

                d3.select(this).attr("fill-opacity", 0.8);
                tooltip
                    .style("visibility", "visible")
                    .html(`
            <strong>${d.venue}</strong><br>
            Total: ${d.count} HRs<br>
            Day: ${d.dayHRs} (${d.dayPct}%)<br>
            Night: ${d.nightHRs} (${d.nightPct}%)
          `);

                if (!activeJitterGroup.has(d.venue)) {
                    const overlapping = getOverlappingPoints(d, mapData);

                    if (overlapping.length > 0) {
                        activeJitterGroup.clear();
                        activeJitterGroup.add(d.venue);
                        overlapping.forEach(point => activeJitterGroup.add(point.venue));

                        overlapping.forEach((point, i) => {
                            const [jitteredX, jitteredY] = jitterPoint(point, i, d);
                            mapGroup.selectAll("circle")
                                .filter(p => p === point)
                                .transition()
                                .duration(300)
                                .attr("cx", jitteredX)
                                .attr("cy", jitteredY)
                                .attr("fill-opacity", 0.8)
                                .attr("data-jittered", "true");
                        });
                    }
                }
            })
            .on("mousemove", function (event) {
                if (activeJitterTimeout) {
                    clearTimeout(activeJitterTimeout);
                    activeJitterTimeout = null;
                }

                tooltip
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function (event, d) {
                d3.select(this).attr("fill-opacity", 0.6);
                tooltip.style("visibility", "hidden");

                if (activeJitterTimeout) {
                    clearTimeout(activeJitterTimeout);
                }

                activeJitterTimeout = setTimeout(() => {
                    const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
                    const isOverCircle = elementAtPoint && elementAtPoint.tagName.toLowerCase() === 'circle';

                    if (!isOverCircle) {
                        activeJitterGroup.clear();
                        mapGroup.selectAll("circle")
                            .transition()
                            .duration(300)
                            .attr("cx", function () { return d3.select(this).attr("data-original-x"); })
                            .attr("cy", function () { return d3.select(this).attr("data-original-y"); })
                            .attr("fill-opacity", 0.6)
                            .attr("data-jittered", null);
                    }
                }, 500);
            })
            .on("click", function (event, d) {
                if (activeJitterTimeout) {
                    clearTimeout(activeJitterTimeout);
                    activeJitterTimeout = null;
                }
                updateTimeGraph(d.venue);
            });

    }).catch(error => {
        console.error('Error loading the data:', error);
    });
});