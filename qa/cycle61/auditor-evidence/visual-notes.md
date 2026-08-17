# Cycle 61 visual notes

At desktop 1280px, the latest build presents the flat workspace tab strip without the redundant workflow-chip row; CHK-125 appears effective for the desktop discoverability change. At iPhone 390px, the workspace shows the six workflow-group chips and Sections cards, but no visible All Labs sheet trigger. The Cycle 61 computed probe re-tests the open issue #64: the All Labs button remains 0×0 at 360/390/430px, inside a parent with `hidden lg:flex` and computed `display:none`.
