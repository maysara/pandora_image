import ox
import sys
with open(sys.argv[2], 'w') as f: f.write(ox.js.minify(open(sys.argv[1]).read()))
