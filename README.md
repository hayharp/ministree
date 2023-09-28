# ministree
This is a demo of an automatic org-chart generator, focused on creating discipleship charts for churches.

## Use
1. For each person, make an entry under name. If they study under someone else, make an entry in that column; otherwise, leave it blank.
2. The role selected will change that person's box color, and style their connecting line, if necessary.
3. Generate the tree with the "Generate Tree" button. If nothing happens, check for typos--each entry in the "Studies Under" column must have a match in the "Name" column.

 * Spacing is automated by how much room is available surrounding the elements. To easily switch up ordering, enter all of the "roots" of each tree first, then reorder those as desired.
 * After many "root" level entries, names will spill into the second half of the screen. To change the person at which this split occurs, change the value of "Split lines at root number:"

4. To save your image, take a screenshot. If you leave the ministree page, the data entered will be saved in localStorage, *so long as you have clicked "Generate Tree"*.
