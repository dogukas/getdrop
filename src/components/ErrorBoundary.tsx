import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

const GREEN = '#2A7A50';
const RED = '#E05C5C';

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error.message, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <View style={s.root}>
                    <View style={s.iconWrap}>
                        <Icon source="alert-circle-outline" size={64} color={RED} />
                    </View>
                    <Text style={s.title}>Bir Şeyler Ters Gitti</Text>
                    <Text style={s.sub}>Uygulama beklenmedik bir hatayla karşılaştı. Lütfen tekrar deneyin.</Text>

                    {this.state.error?.message ? (
                        <View style={s.errorBox}>
                            <Text style={s.errorText} numberOfLines={3}>{this.state.error.message}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity style={s.retryBtn} onPress={this.handleRetry} activeOpacity={0.85}>
                        <Icon source="refresh" size={18} color="white" />
                        <Text style={s.retryText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F4F6F8', alignItems: 'center', justifyContent: 'center', padding: 32 },
    iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: `${RED}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 10 },
    sub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    errorBox: { backgroundColor: '#F8E8E8', borderRadius: 12, padding: 12, marginBottom: 24, width: '100%', borderWidth: 1, borderColor: `${RED}25` },
    errorText: { fontSize: 11, color: RED, fontFamily: 'monospace', lineHeight: 16 },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16, shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    retryText: { fontSize: 15, fontWeight: '800', color: 'white' },
});
