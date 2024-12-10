document.addEventListener('DOMContentLoaded', function() {
    
    const state = {
        position: "0-0",
        history: [],
        isAnimating: false
    };
    
    const totalWidth = 1100;
    const textPanelWidth = 440;
    const vizWidth = 660;
    const height = 480;
    const nodeRadius = 14;
    const margin = {top: 30, right: 36, bottom: 72, left: 36};
    const levelHeight = 72;

    const statsData = {
        "0-0": { totalHits: 6662, homeRuns: 985, hrPct: 14.79 },
        "0-1": { totalHits: 5110, homeRuns: 577, hrPct: 11.29 },
        "0-2": { totalHits: 2492, homeRuns: 213, hrPct: 8.55 },
        "1-0": { totalHits: 4271, homeRuns: 668, hrPct: 15.64 },
        "1-1": { totalHits: 5032, homeRuns: 629, hrPct: 12.50 },
        "1-2": { totalHits: 4484, homeRuns: 432, hrPct: 9.63 },
        "2-0": { totalHits: 1560, homeRuns: 294, hrPct: 18.85 },
        "2-1": { totalHits: 3070, homeRuns: 454, hrPct: 14.79 },
        "2-2": { totalHits: 4638, homeRuns: 523, hrPct: 11.28 },
        "3-0": { totalHits: 130, homeRuns: 34, hrPct: 26.15 },
        "3-1": { totalHits: 1424, homeRuns: 271, hrPct: 19.03 },
        "3-2": { totalHits: 3605, homeRuns: 546, hrPct: 15.15 }
    };


    
    function formatStatsText(countId, comparisonId = null) {
        const stats = statsData[countId];
        if (!stats) return "";
        
        let text = `Current Count (${countId}):\n`;
        text += `HR Rate: ${stats.hrPct.toFixed(2)}%\n\n`;

        if (comparisonId && statsData[comparisonId]) {
        const compStats = statsData[comparisonId];
        text += `Compared to ${comparisonId}:\n`;
        text += `HR Rate: ${compStats.hrPct.toFixed(2)}%\n\n`;
        }

        return text;
    }

    const textContent = {
        "0-0": "Every baseball at-bat begins with 0 balls and 0 strikes. This means that the pitcher has not yet thrown a pitch to the hitter.\n\nIn this situation, the pitcher has the incentive to try and throw a strike on the first pitch, because doing so would give them an advantage for the rest of the at-bat.\n\nOften, the hitter anticipates that the pitcher will try and throw a strike, and will swing hard at the first pitch. This approach yields a lot of home runs when successful, but also is risky for the hitter, which is why most hitters don't swing on the first pitch. \n\n" + formatStatsText("0-0"),
        "1-0": "The pitcher has thrown a ball outside the strike zone and the hitter didn't swing at it.\n\nThe count now swings to 1-0, which favors the hitter, because the hitter now knows that the pitcher's priority is to get the count even again by throwing a strike. As with the 0-0 count, the hitter will often bet that the pitcher will be more careful to throw a strike by throwing a fastball and will swing harder.\n\nThe home run percentage increases from the 0-0 count, though, because the pitcher is trying to undo the disadvantage of first throwing a ball outside the strike zone, and hitters try to capitalize on this impulse.\n\n" + formatStatsText("1-0", "0-0"),
        "0-1": "The pitcher has either thrown a ball inside the strike zone, or has thrown a ball anywhere that the hitter swung at.\n\nThe count now swings to 0-1, which is a definite advantage for the pitcher. The pitcher can now choose to throw some more challenging pitches that might end up outside the zone to see if the hitter will swing at it. You'll notice that the home run percentage decreases compared to the 0-0 count.\n\n" + formatStatsText("0-1", "0-0"),
        "2-0": "The pitcher has now thrown two balls outside the strike zone and has thrown no strikes.\n\nThis further amplifies the advantage of the hitter, because the hitter knows that the pressure is on the pitcher to throw strikes. Accordingly, the hitter will anticipate a fastball and will likely swing hard.\n\n" + formatStatsText("2-0"),
        "1-1": "The pitcher has now thrown one ball outside the strike zone and one strike.\n\nThis count represents a more even playing field between the hitter and the pitcher, but you'll notice a decrease in home run percentage compared to the 0-0 count because hitters tend to become more patient and swing less as the on-bat continues.\n\n" + formatStatsText("1-1", "0-0"),
        "0-2":  "The pitcher has now thrown no balls outside the strike zone, and two strikes.\n\nThis is the worst case scenario for the hitter, and this is the count that has the lowest home run percentage. This is because the pitcher has no incentive to throw a pitch that is easier to hit for a home run (like a fastball), and thus has a lot of creative freedom to try and put the hitter off balance.\n\n" + formatStatsText("0-2", "0-1"),
        "3-0": 'The pitcher has now thrown 3 straight balls outside the strike zone, and no strikes.\n\nThis is the best case scenario for the hitter, and this is the count that has the highest home run percentage. The hitter knows that there is intense pressure to not throw another ball outside the strike zone, otherwise the hitter will advance to first base in what is called a "walk" or "base on balls".\n\nThe incentive for the hitter is to swing as hard as possible and hope that something connects, and it very often does, as almost a quarter of all hits in this count are for home runs.\n\n' + formatStatsText("3-0"),
        "2-1": "The pitcher has now thrown 2 balls outside the strike zone and only one strike.\n\nMuch as with the 1-0 count, this count represents a moderate advantage for the hitter, since the goal of the pitcher is to always throw strikes and even the count. However, there is a moderate decrease in home run percentage compared to the 1-0 count, since hitters tend to become more patient as the at-bat continues.\n\n" + formatStatsText("2-1", "1-0"),
        "1-2": "The pitcher has now thrown 1 ball outside the strike zone and 2 strikes.\n\nThe advantage swings decisively in favor of the pitcher, as they only need to throw 1 more strike to get the hitter out.\n\nAs with the 0-2 count, the pitcher has the ability to throw more difficult pitches that might fall outside of the strike zone but that the hitter might swing at. So, fewer home runs are hit in this count compared to the 1-1 count, but more home runs are hit compared to the 0-2 count.\n\n" + formatStatsText("1-2", "0-2"),
        "3-1": "The pitcher has now thrown 3 balls outside the strike zone and 1 strike.\n\nThis is less of an advantage for the hitter compared to the 3-0 count, but still a decisively advantageous position overall. The pressure is still on the pitcher to throw a strike, and the incentive is still on the hitter to swing hard and hope you make good contact.\n\n" + formatStatsText("3-1", "3-0"),
        "2-2": "The pitcher has now thrown 2 balls outside the strike zone and 2 strikes.\n\nAs with the 0-0 and 1-1 counts, this count is a more even playing field between the hitter and pitcher. However, the pitcher has a slight advantage, because they only need to throw 1 more strike to get the hitter out.\n\nYou'll notice a lower home run percentage in this count than 1-1, and this is because of the slight pitcher advantage, and also because hitters start to swing defensively in this count.\n\n" + formatStatsText("2-2", "1-1"),
        "3-2": "The pitcher has now thrown 3 balls outside the strike zone and 2 strikes.\n\nThis is the holy grail of baseball at-bats. The pressure is felt intensely by both the pitcher and the hitter, because one more ball means the hitter advances to first base, but one more strike means the hitter is out.\n\nAccordingly, there is a higher home run percentage in this count than 2-2 because the hitter is going to bet on the pitcher throwing a strike.\n\n" + formatStatsText("3-2", "2-2"),
        "BB": "Walk! The batter has earned a base on balls and will advance to first base.",
        "OUT": "Strike three! The batter is out."
    };

    // Define node levels (x values adjusted for new width)
    const levels = [
        [{id: "0-0", x: 0.5}],
        [{id: "1-0", x: 0.35}, {id: "0-1", x: 0.65}],
        [{id: "2-0", x: 0.2}, {id: "1-1", x: 0.5}, {id: "0-2", x: 0.8}],
        [{id: "3-0", x: 0.1}, {id: "2-1", x: 0.35}, {id: "1-2", x: 0.65}, {id: "OUT", x: 0.9}],
        [{id: "BB", x: 0.2}, {id: "3-1", x: 0.5}, {id: "2-2", x: 0.8}],
        [{id: "3-2", x: 0.5}]
    ];

    // Define edges
    const edges = [
        {source: "0-0", target: "1-0", type: "ball"},
        {source: "0-0", target: "0-1", type: "strike"},
        {source: "1-0", target: "2-0", type: "ball"},
        {source: "1-0", target: "1-1", type: "strike"},
        {source: "0-1", target: "1-1", type: "ball"},
        {source: "0-1", target: "0-2", type: "strike"},
        {source: "2-0", target: "3-0", type: "ball"},
        {source: "2-0", target: "2-1", type: "strike"},
        {source: "1-1", target: "2-1", type: "ball"},
        {source: "1-1", target: "1-2", type: "strike"},
        {source: "0-2", target: "1-2", type: "ball"},
        {source: "0-2", target: "OUT", type: "strike"},
        {source: "3-0", target: "BB", type: "ball"},
        {source: "3-0", target: "3-1", type: "strike"},
        {source: "2-1", target: "3-1", type: "ball"},
        {source: "2-1", target: "2-2", type: "strike"},
        {source: "1-2", target: "2-2", type: "ball"},
        {source: "1-2", target: "OUT", type: "strike"},
        {source: "3-1", target: "BB", type: "ball"},
        {source: "3-1", target: "3-2", type: "strike"},
        {source: "2-2", target: "3-2", type: "ball"},
        {source: "2-2", target: "OUT", type: "strike"},
        {source: "3-2", target: "BB", type: "ball"},
        {source: "3-2", target: "OUT", type: "strike"}
    ];

        function findParentNodes(nodeId) {
    return edges
        .filter(edge => edge.target === nodeId)
        .map(edge => edge.source);
    }
// Set explicit layout dimensions
const totalHeight = height + 90;

const container = d3.select("#viz3-container")
  .style("position", "relative")  // Changed from absolute
  .style("width", "100%")
  .style("height", `${(height + 90) * 0.8}px`)
  .style("margin", "2rem 0")     // Added margin
  .append("div")
  .style("width", "100%")
  .style("height", "100%")
  .style("display", "flex")
  .style("flex-direction", "row")
  .style("overflow", "hidden");

// Create text panel with flex properties
const textPanel = container.append("div")
  .style("flex", `0 0 ${textPanelWidth}px`)
  .style("height", "100%")
  .style("background", "#ffffff")
  .style("padding", "24px")
  .style("border-right", "1px solid #e2e8f0")
  .style("overflow-y", "auto");

// Create text elements (unchanged)
const countHeader = textPanel.append("h2")
  .style("font-size", "24px")
  .style("font-weight", "bold")
  .style("font-family", "system-ui, -apple-system, sans-serif")
  .style("color", "#2d3748")
  .style("margin-bottom", "16px")
  .style("opacity", "0")
  .text("0-0 COUNT");

const textContent1 = textPanel.append("div")
  .style("font-size", "16px")
  .style("line-height", "1.6")
  .style("font-family", "system-ui, -apple-system, sans-serif")
  .style("color", "#4a5568")
  .style("white-space", "pre-wrap")
  .style("opacity", "0")
  .text(textContent["0-0"]);

// Create visualization container with flex properties
const vizContainer = container.append("div")
  .style("flex", `1 1 ${vizWidth}px`)  // Changed to flex property
  .style("height", "100%")
  .style("position", "relative");

// Create SVG with explicit dimensions
const svg = vizContainer.append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("viewBox", [0, 0, vizWidth, height])
  .attr("preserveAspectRatio", "xMidYMid meet")
  .style("background", "linear-gradient(to bottom, #f8f9fa, #ffffff)");

// Definitions and groups remain the same
const defs = svg.append("defs");

defs.append("filter")
  .attr("id", "drop-shadow")
  .append("feDropShadow")
  .attr("dx", "0")
  .attr("dy", "1")
  .attr("stdDeviation", "1")
  .attr("flood-opacity", "0.2");

defs.selectAll("marker")
  .data(["ball", "strike"])
  .join("marker")
  .attr("id", d => `arrow-${d}`)
  .attr("viewBox", "-10 -5 10 10")
  .attr("refX", 0)
  .attr("refY", 0)
  .attr("markerWidth", 4)
  .attr("markerHeight", 4)
  .attr("orient", "auto")
  .append("path")
  .attr("fill", d => d === "ball" ? "#38a169" : "#e53e3e")
  .attr("d", "M-10,-5L0,0L-10,5");

const edgeGroup = svg.append("g");
const nodeGroup = svg.append("g");

    // Create scales
    const xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([margin.left, vizWidth - margin.right]);

    // Helper function to calculate path
    function calculatePath(source, target) {
        const sourceX = xScale(source.x);
        const sourceY = margin.top + source.level * levelHeight;
        const targetX = xScale(target.x);
        const targetY = margin.top + target.level * levelHeight;

        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const angle = Math.atan2(dy, dx);

        const startX = sourceX + (Math.cos(angle) * nodeRadius);
        const startY = sourceY + (Math.sin(angle) * nodeRadius);
        const endX = targetX - (Math.cos(angle) * nodeRadius);
        const endY = targetY - (Math.sin(angle) * nodeRadius);

        const midY = (startY + endY) / 2;

        return `M ${startX},${startY} 
                C ${startX},${midY}
                ${endX},${midY}
                ${endX},${endY}`;
    }

    // Calculate zoom transform for a given state
    function calculateZoomTransform(state) {
        const pathNodes = [state.position];
        let currentNode = state.position;
        
        [...state.history].reverse().forEach(move => {
        if (move.target === currentNode) {
            pathNodes.unshift(move.source);
            currentNode = move.source;
        }
        });

        const nodePositions = pathNodes.map(nodeId => {
        const level = levels.findIndex(level => level.some(node => node.id === nodeId));
        const node = levels[level].find(node => node.id === nodeId);
        return {
            x: xScale(node.x),
            y: margin.top + level * levelHeight
        };
        });

        const padding = 90;
        const bounds = {
        left: d3.min(nodePositions, d => d.x) - padding,
        right: d3.max(nodePositions, d => d.x) + padding,
        top: d3.min(nodePositions, d => d.y) - padding,
        bottom: d3.max(nodePositions, d => d.y) + padding
        };

        const x = vizWidth / (bounds.right - bounds.left);
        const yScale = height / (bounds.bottom - bounds.top);
        const scale = Math.min(x, yScale, 2);

        const centerX = (bounds.left + bounds.right) / 2;
        const centerY = (bounds.top + bounds.bottom) / 2;

        return d3.zoomIdentity
        .translate(vizWidth/2 - centerX * scale, height/2 - centerY * scale)
        .scale(scale);
    }

    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 2])
        .on("zoom", ({transform}) => {
        nodeGroup.attr("transform", transform);
        edgeGroup.attr("transform", transform);
        });

    svg.call(zoom);

    function smoothZoomTo(targetTransform, duration = 750) {
        svg.transition()
        .duration(duration)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, targetTransform);
    }

    // Create controls container
    const controls = vizContainer.append("div")
        .style("position", "absolute")
        .style("bottom", "24px")
        .style("left", "50%")
        .style("transform", "translateX(-50%)")
        .style("display", "flex")
        .style("gap", "24px")
        .style("width", "100%")
        .style("justify-content", "center");

    // Button creation helper
    function createButton(text, type) {
        const colors = type === 'ball' 
        ? {
            base: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
            hover: "linear-gradient(135deg, #68d391 0%, #48bb78 100%)",
            active: "linear-gradient(135deg, #38a169 0%, #2f855a 100%)",
            border: "#2f855a"
            }
        : type === 'strike' 
        ? {
            base: "linear-gradient(135deg, #f56565 0%, #e53e3e 100%)",
            hover: "linear-gradient(135deg, #fc8181 0%, #f56565 100%)",
            active: "linear-gradient(135deg, #e53e3e 0%, #c53030 100%)",
            border: "#c53030"
            }
        : {
            base: "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)",
            hover: "linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)",
            active: "linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)",
            border: "#2b6cb0"
            };

        return d3.create("button")
        .style("padding", "16px 32px")
        .style("font-size", "20px")
        .style("font-weight", "600")
        .style("font-family", "system-ui, -apple-system, sans-serif")
        .style("color", "white")
        .style("background", colors.base)
        .style("border", "none")
        .style("border-radius", "10px")
        .style("cursor", "pointer")
        .style("min-width", "120px")
        .style("letter-spacing", "1px")
        .style("text-transform", "uppercase")
        .style("position", "relative")
        .style("box-shadow", "0 2px 4px rgba(0, 0, 0, 0.1)")
        .style("transition", "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)")
        .text(text)
        .on("mouseover", function() {
            d3.select(this)
            .style("transform", "translateY(-1px)")
            .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.15)")
            .style("background", colors.hover);
        })
        .on("mouseout", function() {
            d3.select(this)
            .style("transform", "translateY(0)")
            .style("box-shadow", "0 2px 4px rgba(0, 0, 0, 0.1)")
            .style("background", colors.base);
        })
        .on("mousedown", function() {
            d3.select(this)
            .style("transform", "translateY(1px)")
            .style("box-shadow", "0 1px 2px rgba(0, 0, 0, 0.1)")
            .style("background", colors.active);
        })
        .on("mouseup", function() {
            d3.select(this)
            .style("transform", "translateY(-1px)")
            .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.15)")
            .style("background", colors.hover);
        });
    }

    // Update view function
    function updateView() {
    // Get parent nodes of current position
    const parentNodes = findParentNodes(state.position);
    
    // Helper function to check if node should be visible
    function isNodeVisible(nodeId) {
        const isInPath = state.history.some(move => 
        move.source === nodeId || move.target === nodeId
        );
        const isParentOfCurrent = parentNodes.includes(nodeId);
        return nodeId === state.position || isInPath;
    }

    // Update text panel with transition
    countHeader
        .style("opacity", "0")
        .transition()
        .duration(300)
        .style("opacity", "1")
        .text(state.position === "BB" || state.position === "OUT" 
        ? state.position
        : `${state.position} COUNT`);

    textContent1
        .style("opacity", "0")
        .transition()
        .duration(300)
        .style("opacity", "1")
        .text(textContent[state.position]);

    // Update edges - only show edges in actual path
    edgeGroup.selectAll("path")
        .data(edges)
        .join("path")
        .attr("d", edge => {
        const sourceLevel = levels.findIndex(level => level.some(node => node.id === edge.source));
        const targetLevel = levels.findIndex(level => level.some(node => node.id === edge.target));
        const sourceNode = {
            ...levels[sourceLevel].find(node => node.id === edge.source),
            level: sourceLevel
        };
        const targetNode = {
            ...levels[targetLevel].find(node => node.id === edge.target),
            level: targetLevel
        };
        
        return calculatePath(sourceNode, targetNode);
        })
        .attr("stroke", edge => edge.type === "ball" ? "#38a169" : "#e53e3e")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .transition()
        .duration(300)
        .attr("opacity", edge => {
        const isInHistory = state.history.some(move => 
            move.source === edge.source && move.target === edge.target
        );
        return isInHistory ? 1 : 0.1;
        })
        .attr("marker-end", edge => `url(#arrow-${edge.type})`);

    // Update nodes
    levels.forEach((level, levelIndex) => {
        const nodes = nodeGroup.selectAll(`g.level-${levelIndex}`)
        .data(level)
        .join("g")
        .attr("class", `level-${levelIndex}`)
        .attr("transform", d => `translate(${xScale(d.x)},${margin.top + levelIndex * levelHeight})`);

        // Add base node circles
        nodes.selectAll("circle")
        .data(d => [d])
        .join("circle")
        .attr("r", nodeRadius)
        .attr("fill", d => {
            if (d.id === "BB") return "#9ae6b4";
            if (d.id === "OUT") return "#fc8181";
            if (d.id === "0-0") return "#bee3f8";
            return "#ffffff";
        })
        .attr("stroke", d => {
            if (d.id === "BB") return "#38a169";
            if (d.id === "OUT") return "#e53e3e";
            if (d.id === "0-0") return "#3182ce";
            return "#718096";
        })
        .attr("stroke-width", d => d.id === state.position ? 2 : 1.5)
        .transition()
        .duration(300)
        .attr("opacity", d => isNodeVisible(d.id) ? 1 : 0.1);

        // Add node labels
        nodes.selectAll("text.node-label")
        .data(d => [d])
        .join("text")
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("font-size", "10px")
        .attr("font-family", "system-ui, -apple-system, sans-serif")
        .attr("fill", "#2d3748")
        .text(d => d.id)
        .transition()
        .duration(300)
        .attr("opacity", d => isNodeVisible(d.id) ? 1 : 0.1);

        // Add HR% labels with transitions
        const statLabels = nodes.selectAll("g.stat-label")
        .data(d => statsData[d.id] ? [d] : [])
        .join(
            enter => {
            const g = enter.append("g")
                .attr("class", "stat-label")
                .attr("transform", `translate(${nodeRadius + 4}, -${nodeRadius + 4})`)
                .attr("opacity", 0);

            g.append("rect")
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("fill", "white")
                .attr("filter", "url(#drop-shadow)")
                .attr("x", -2)
                .attr("y", -8)
                .attr("width", d => `${statsData[d.id].hrPct.toFixed(2)}%`.length * 5.5 + 4)
                .attr("height", 16);

            g.append("text")
                .attr("font-size", "9px")
                .attr("font-family", "system-ui, -apple-system, sans-serif")
                .attr("fill", "#4a5568")
                .attr("dy", "0.35em")
                .text(d => `${statsData[d.id].hrPct.toFixed(2)}%`);

            return g;
            },
            update => update,
            exit => exit.transition().duration(300).attr("opacity", 0).remove()
        )
        .transition()
        .duration(300)
        .attr("opacity", d => isNodeVisible(d.id) ? 1 : 0);
    });

    updateControls();
    }

    function updateControls() {
        controls.selectAll("*").remove();

        if (state.position === "BB" || state.position === "OUT") {
        controls.append(() => 
            createButton("Reset", "reset")
            .on("click", reset)
            .node()
        );
        return;
        }

        const moves = edges.filter(edge => edge.source === state.position);
        moves.forEach(move => {
        controls.append(() => 
            createButton(move.type, move.type)
            .on("click", () => makeMove(move))
            .node()
        );
        });
    }

    function makeMove(move) {
        if (state.isAnimating) return;
        state.isAnimating = true;

        // Pre-calculate the final state
        const nextState = {
        position: move.target,
        history: [...state.history, move]
        };

        // Calculate and perform the zoom
        const targetTransform = calculateZoomTransform(nextState);

        // Update state
        state.history = nextState.history;
        state.position = nextState.position;

        // Perform single smooth transition
        smoothZoomTo(targetTransform, 750);
        
        // Update view
        updateView();
        
        setTimeout(() => {
        state.isAnimating = false;
        }, 750);
    }

    function reset() {
        if (state.isAnimating) return;
        state.isAnimating = true;

        // Reset state
        state.history = [];
        state.position = "0-0";

        // Calculate and perform the zoom
        const targetTransform = calculateZoomTransform(state);
        smoothZoomTo(targetTransform, 750);
        
        // Update view
        updateView();
        
        setTimeout(() => {
        state.isAnimating = false;
        }, 750);
    }

    // Initial setup
    const initialTransform = calculateZoomTransform(state);
    smoothZoomTo(initialTransform, 0);
    updateView();

    // Show initial text with transition
    countHeader.transition().duration(300).style("opacity", "1");
    textContent1.transition().duration(300).style("opacity", "1");
});