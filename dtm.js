/* Discipleship Tree Maker by Nathan Hay (2023) */

/* Input Table Management */
var new_row_btn = document.getElementById('new-row')
var rm_row_btn = document.getElementById('rm-row')
var clear_table_btn = document.getElementById('clear-table')

if (localStorage.getItem('input-table')) {
    document.getElementById('input-table').innerHTML = localStorage.getItem('input-table')
}
var input_table = document.getElementById('input-table')
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
            <select name="role">
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
    for (let row = 1; row < input_table_rows.length; row ++) {
        let row_contents = input_table_rows[row].getElementsByTagName('td')
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
    for (key in tree) {
        if (!('children' in tree[key])) {
            tree[key]['children'] = []
        }
    }
    return (tree)
}

function get_tree_dimensions(tree) { // Gets the number of boxes per row, and add that metadata to the tree
    dimensions = {}
    repeats = []
    for (person in tree) {
        if (tree[person]['parent'] == '') {
            tree[person]['row'] = 1
            if (!(1 in dimensions)) {
                dimensions[1] = {'width': 1, 'people': [person]}
            } else {
                dimensions[1]['width'] += 1
                dimensions[1]['people'].push(person)
            }
        } else {
            if ('row' in tree[tree[person]['parent']]) {
                tree[person]['row'] = tree[tree[person]['parent']]['row'] + 1
                if (!(tree[person]['row'] in dimensions)) {
                    dimensions[tree[person]['row']] = {'width': 1, 'people': [person]}
                } else {
                    dimensions[tree[person]['row']]['width'] += 1
                    dimensions[tree[person]['row']]['people'].push(person)
                }
            } else {
                repeats.push(person)
            }
        }
    }
    while (repeats.length > 0) {
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
    return (dimensions)
}

function get_good_font_size(width, text) {
    test_size = width / (text.split(' ')[0].length)
    if (test_size > 1.2) {
        test_size = 1.2
    }
    return (`${test_size}vw`)
}

gen_btn.addEventListener('click', function() { // Generates org chart
    localStorage.setItem('input-table', input_table.innerHTML) // Saves the input table when the tree is generated
    tree_box.innerHTML = ''
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    var tree = parse_input_table()
    var dimensions = get_tree_dimensions(tree)
    for (row in dimensions) {
        let row_div = document.createElement('div')
        row_div.classList.add('row')
        row_div.id = `row_${parseInt(row)}`
        tree_box.appendChild(row_div)
    }
    for (row in dimensions) {
        let row_div = document.getElementById(`row_${parseInt(row)}`)
        if (parseInt(row) == 1) {
            for (let i = 0; i < dimensions[row]['width']; i++) {
                let new_box = document.createElement('div')
                new_box.id = dimensions[row]['people'][i]
                new_box.textContent = dimensions[row]['people'][i]
                new_box.classList.add('tree-node')
                new_box.style.backgroundColor = role_colors[tree[dimensions[row]['people'][i]]['role']]
                new_box.style.width = `${100 / (dimensions[row]['width'] * 2 + 1)}%`
                new_box.style.left = `${100 * (2*i+.5) / (dimensions[row]['width'] * 2)}%` // Space top row evenly
                row_div.appendChild(new_box)
            }
        } else {
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
                console.log(space_right, parent)
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
                    new_box.style.top = `${10*parseInt(row)}%`
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
            console.log(tree[person]['children'][child])
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