import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          p={8}
          h="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
        >
          <VStack spacing={4} maxW="450px">
            <Box color="yellow.400" fontSize="4xl">
              <FiAlertTriangle />
            </Box>
            <Heading size="md">
              {this.props.fallbackTitle || 'Something went wrong'}
            </Heading>
            <Text fontSize="sm" color="gray.400">
              An unexpected error occurred while rendering this view.
            </Text>
            {this.state.error && (
              <Box
                p={3}
                bg="blackAlpha.300"
                borderRadius="md"
                fontSize="xs"
                color="red.300"
                fontFamily="mono"
                maxW="100%"
                overflowX="auto"
              >
                {this.state.error.message}
              </Box>
            )}
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<FiRefreshCw />}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
