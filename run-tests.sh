#!/bin/bash
# WealthVision Test Runner

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TEST_ENV="NODE_ENV=test"
JEST_CMD="npx jest --config=jest.config.ts"
JEST_OPTS="--no-cache"

# Display usage information
function show_usage {
  echo -e "${BLUE}WealthVision Test Runner${NC}"
  echo ""
  echo "Usage: ./run-tests.sh [options] [test-pattern]"
  echo ""
  echo "Options:"
  echo "  -h, --help        Show this help message"
  echo "  -v, --verbose     Run tests with verbose output"
  echo "  -w, --watch       Run tests in watch mode"
  echo "  -c, --coverage    Run tests with coverage report"
  echo "  -u, --utils       Run only utility tests"
  echo "  -f, --forecast    Run only forecast calculator tests"
  echo "  -b, --basic       Run only basic tests (utils + forecast)"
  echo ""
  echo "Examples:"
  echo "  ./run-tests.sh                    # Run all tests"
  echo "  ./run-tests.sh -v                 # Run all tests with verbose output"
  echo "  ./run-tests.sh -c                 # Run all tests with coverage report"
  echo "  ./run-tests.sh -u                 # Run only utility tests"
  echo "  ./run-tests.sh client/src/utils   # Run tests matching 'client/src/utils'"
  echo ""
}

# Set default values
VERBOSE=""
WATCH=""
COVERAGE=""
TEST_PATTERN=""

# Process command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_usage
      exit 0
      ;;
    -v|--verbose)
      VERBOSE="--verbose"
      shift
      ;;
    -w|--watch)
      WATCH="--watch"
      shift
      ;;
    -c|--coverage)
      COVERAGE="--coverage"
      shift
      ;;
    -u|--utils)
      TEST_PATTERN="client/src/__tests__/basic.test.ts"
      shift
      ;;
    -f|--forecast)
      TEST_PATTERN="client/src/__tests__/forecast-calculator"
      shift
      ;;
    -b|--basic)
      TEST_PATTERN="client/src/__tests__/basic.test.ts client/src/__tests__/forecast-calculator.basic.test.ts"
      shift
      ;;
    *)
      # If not a flag, treat as test pattern
      if [[ $1 != -* ]]; then
        TEST_PATTERN="$1"
      fi
      shift
      ;;
  esac
done

# Build the command
CMD="$TEST_ENV $JEST_CMD $JEST_OPTS $VERBOSE $WATCH $COVERAGE $TEST_PATTERN"

# Display what we're running
echo -e "${YELLOW}Running tests with:${NC} $CMD"
echo ""

# Execute the command
eval $CMD

# Get the exit code
EXIT_CODE=$?

# Exit with the Jest exit code
exit $EXIT_CODE