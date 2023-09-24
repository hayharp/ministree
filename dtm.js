/* Discipleship Tree Maker by Nathan Hay (2023) */

/* Input Table Management */
var new_row_btn = document.getElementById('new-row')
var rm_row_btn = document.getElementById('rm-row')
var clear_table_btn = document.getElementById('clear-table')

if (localStorage.getItem('input-table')) {
    document.getElementById('input-table').innerHTML = localStorage.getItem('input-table')
    var input_table = document.getElementById('input-table')
    let table_values = Array.from(input_table.getElementsByTagName('select'))
    for (select in table_values) {
        table_values[select].value = table_values[select].getAttribute('value')
    }
} else {
    var input_table = document.getElementById('input-table')
}
var input_table_rows = input_table.getElementsByTagName('tbody')[0].getElementsByTagName('tr')
var current_row = input_table_rows.length - 1

new_row_btn.addEventListener('click', function() {  // Adds an empty row to the input table when new_row button is clicked
    current_row += 1
    var tr = document.createElement('tr')
    tr.setAttribute('id', `r${current_row}`)
    tr.innerHTML =
        `<td contenteditable="true" class="name"></td>
        <td contenteditable="true" class="parent"></td>
        <td class="role">
            <select name="role" value="none">
                <option value="none">N/A</option>
                <option value="servant_team">Servant Team</option>
                <option value="high_schooler">High Schooler</option>
                <option value="follow_up">Follow-Up</option>
                <option value="other_leaders">Other Leaders</option>
            </select>
        </td>`
    input_table.getElementsByTagName('tbody')[0].append(tr)
})

rm_row_btn.addEventListener('click', function() { // Removes the last row from the input table when rm_row button is clicked
    document.getElementById(`r${current_row}`).remove()
    current_row -= 1
})

clear_table_btn.addEventListener('click', function() { // Clears the table and localStorage
    for (let row = current_row; row > 0; row--) {
        document.getElementById(`r${row}`).remove()
    }
    current_row = 0
    localStorage.removeItem('input-table')
})

/* Tree Generator */
const role_colors = {
    'none': 'yellow',
    'servant_team': 'blue',
    'high_schooler': 'green',
    'follow_up': 'darkgray',
    'other_leaders': 'lightgray'
}
const role_lines = {
    'none': [],
    'servant_team': [],
    'high_schooler': [],
    'follow_up': [8, 15],
    'other_leaders': []
}
var gen_btn = document.getElementById('gen-org-chart')
var tree_box = document.getElementById('tree-box')
var canvas = document.getElementById('tree-lines')
var ctx = canvas.getContext('2d')
ctx.canvas.width = window.innerWidth
ctx.canvas.height = window.innerHeight

function parse_input_table() { // Turns the input table into a usable format
    tree = {}
    tree_roots = []
    for (let row = 1; row < input_table_rows.length; row ++) { // Add input table entries to tree
        let row_contents = input_table_rows[row].getElementsByTagName('td')
        if (row_contents[0].textContent) {
            if (!(row_contents[0].textContent in tree)) {
                tree[row_contents[0].textContent] = {}
            }
            tree[row_contents[0].textContent]['parent'] = row_contents[1].textContent
            tree[row_contents[0].textContent]['role'] = row_contents[2].getElementsByTagName('select')[0].value
            if (row_contents[1].textContent !== '') { // Attempt to add self to parent list, if person has one
                if (!(row_contents[1].textContent in tree)) { // If parent is not in tree, instantiate them
                    tree[row_contents[1].textContent] = {}
                    tree[row_contents[1].textContent]['children'] = []
                }
                if (!('children' in tree[row_contents[1].textContent])) {
                    tree[row_contents[1].textContent]['children'] = []
                }
                tree[row_contents[1].textContent]['children'].push(row_contents[0].textContent)
            }
        }
    }
    for (key in tree) {
        if (!('children' in tree[key])) { // Add an empty list when there are no child nodes
            tree[key]['children'] = []
        }
        if (tree[key]['parent'] !== '') { // Get root of tree
            var looper = 20 // Safeguard to prevent runaway loop
            var depth = 2
            var layer_up = tree[key]['parent']
            while (looper) {
                if (tree[layer_up]['parent'] == '') {
                    looper = 0
                } else {
                    looper--
                    depth++
                    layer_up = tree[layer_up]['parent']
                }
            }
            tree[key]['root'] = layer_up
            tree[layer_up]['depth'] = depth
        } else {
            tree[key]['root'] = key
        if (!(tree_roots.includes(tree[key]['root']))) {
            tree_roots.push(key)
        }
        }
    }
    return [tree, tree_roots]
}

function get_tree_dimensions(tree, tree_roots, split_num) { // Gets the number of boxes per row, and add that metadata to the tree
    var dimensions = {1: {'width': 0, 'people': []}}
    var repeats = []
    let max_depth = 1
    var top_rows = [1]
    for (person in tree_roots) { // Create "root" rows
        if (dimensions[1]['width'] < split_num) {
            tree[tree_roots[person]]['row'] = 1
            dimensions[1]['people'].push(tree_roots[person])
            if (tree[tree_roots[person]]['depth'] > max_depth) {
                max_depth = tree[tree_roots[person]]['depth']
            }
            dimensions[1]['width'] += 1
        } else { // If split_num is surpassed, start a secondary row lower than the maximum depth of row 1 children
            if (!((max_depth + 1) in dimensions)) {
                dimensions[max_depth + 1] = {'width': 0, 'people': []}
                top_rows.push(max_depth + 1)
            }
            dimensions[max_depth + 1]['width'] += 1
            dimensions[max_depth + 1]['people'].push(tree_roots[person])
            tree[tree_roots[person]]['row'] = max_depth + 1
        }
    }
    for (person in tree) { // Populate all other rows
        if (tree[person]['parent'] !== '') {
            repeats.push(person)
        }
    }
    while (repeats.length > 0) { // Do passes to populate all rows
        newrepeat = []
        for (personindex in repeats) {
            let person = repeats[personindex]
            if ('row' in tree[tree[person]['parent']]) {
                tree[person]['row'] = tree[tree[person]['parent']]['row'] + 1
                if (!(tree[person]['row'] in dimensions)) {
                    dimensions[tree[person]['row']] = {'width': 1, 'people': [person]}
                } else {
                    dimensions[tree[person]['row']]['width'] += 1
                    dimensions[tree[person]['row']]['people'].push(person)
                }
            } else {
                newrepeat.push(person)
            }
        }
        repeats = newrepeat
    }
    return [dimensions, top_rows]
}

function get_good_font_size(width, text) { // Gets an appropriate font size
    test_size = width / (text.split(' ')[0].length)
    if (test_size > 1.2) {
        test_size = 1.2
    }
    return (`${test_size}vw`)
}

gen_btn.addEventListener('click', function() { // Generates org chart
    let table_values = Array.from(input_table.getElementsByTagName('select'))
    for (select in table_values) {
        console.log(select)
        console.log(table_values[select])
        //console.log(select, table_values[select].value)
        table_values[select].setAttribute('value',  table_values[select].value) 
    }
    localStorage.setItem('input-table', input_table.innerHTML) // Saves the input table when the tree is generated
    tree_box.innerHTML = ''
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    var split_num = document.getElementById('split-num').value
    var [tree, tree_roots] = parse_input_table()
    var [dimensions, top_rows] = get_tree_dimensions(tree, tree_roots, split_num)
    var working_height = 10
    if (Object.keys(dimensions).length >= 5) {
        working_height = 80 / Object.keys(dimensions).length
    }
    for (row in dimensions) { // Adds row divs, primarily as an organizational technique
        let row_div = document.createElement('div')
        row_div.classList.add('row')
        row_div.id = `row_${parseInt(row)}`
        tree_box.appendChild(row_div)
    }
    for (row in dimensions) {
        let row_div = document.getElementById(`row_${parseInt(row)}`)
        if (top_rows.includes(parseInt(row))) { // Populate top rows
            for (let i = 0; i < dimensions[row]['width']; i++) {
                let new_box = document.createElement('div')
                new_box.id = dimensions[row]['people'][i]
                new_box.textContent = dimensions[row]['people'][i]
                new_box.classList.add('tree-node')
                new_box.style.backgroundColor = role_colors[tree[dimensions[row]['people'][i]]['role']]
                new_box.style.width = `${95 / (dimensions[row]['width'] * 2 + 1)}%`
                new_box.style.left = `${100 * (2*i+.5) / (dimensions[row]['width'] * 2)}%` // Space top row evenly
                new_box.style.top = `${working_height * parseInt(row)}%`
                if (parseInt(row) == 1) {
                    new_box.style.top = '5%'
                }
                row_div.appendChild(new_box)
            }
        } else { // Populate all other rows
            for (person in dimensions[parseInt(row - 1)]['people']) {
                let parent = dimensions[parseInt(row - 1)]['people'][person]
                let parent_node = document.getElementById(parent)
                let working_width = parseFloat(parent_node.style.width) / tree[parent]['children'].length
                let space_left = 0
                let space_right = 0
                if (parseInt(person) > 0 & tree[parent]['children'].length > 1) {
                    if (tree[dimensions[parseInt(row - 1)]['people'][person - 1]]['children'].length == 0) {
                        space_left = parseFloat(document.getElementById(dimensions[parseInt(row - 1)]['people'][parseInt(person) - 1]).style.width)
                        working_width += space_left / 4
                    }
                }
                if (parseInt(person) < dimensions[parseInt(row - 1)]['width'] - 1 & tree[parent]['children'].length > 1) {
                    if (tree[dimensions[parseInt(row - 1)]['people'][parseInt(person) + 1]]['children'].length == 0) {
                        space_right = parseFloat(document.getElementById(dimensions[parseInt(row - 1)]['people'][parseInt(person) + 1]).style.width)
                        working_width += space_right / 4
                    }
                }
                for (child in tree[parent]['children']) {
                    let new_box = document.createElement('div')
                    new_box.id = tree[parent]['children'][child]
                    new_box.textContent = tree[parent]['children'][child]
                    new_box.classList.add('tree-node')
                    new_box.style.backgroundColor = role_colors[tree[tree[parent]['children'][child]]['role']]
                    let working_space = (2 * child + .5) * working_width + parseFloat(parent_node.style.left) - parseInt(parent_node.style.width) / 2
                    if (tree[parent]['children'].length == 1) {
                        working_space = parseFloat(parent_node.style.left)
                    }
                    new_box.style.top = `${working_height*parseInt(row)}%`
                    new_box.style.fontSize = get_good_font_size(working_width, new_box.innerText)
                    new_box.style.width = `${working_width}%`
                    new_box.style.left = `${working_space - space_left}%`
                    row_div.appendChild(new_box)
                }
            }
        }
    }
    /* Drawing pass */
    for (person in tree) {
        let rect = document.getElementById(person).getBoundingClientRect()
        let bottom_center = {
            'x': rect['x'] + rect['width']/2,
            'y': rect['bottom'] + 1
        }
        for (child in tree[person]['children']) {
            let child_rect = document.getElementById(tree[person]['children'][child]).getBoundingClientRect()
            let top_center = {
                'x': child_rect['x'] + child_rect['width']/2,
                'y': child_rect['top'] + 1
            }
            ctx.beginPath()
            ctx.setLineDash(role_lines[tree[tree[person]['children'][child]]['role']])
            ctx.moveTo(bottom_center['x'], bottom_center['y'])
            ctx.lineTo(bottom_center['x'], bottom_center['y'] + (top_center['y'] - bottom_center['y']) / 2)
            ctx.lineTo(top_center['x'], bottom_center['y'] + (top_center['y'] - bottom_center['y']) / 2)
            ctx.lineTo(top_center['x'], top_center['y'])
            ctx.stroke()
        }
    }
})