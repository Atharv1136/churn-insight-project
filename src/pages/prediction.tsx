import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, type CustomerInput, type PredictionResult } from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function Prediction() {
    const [formData, setFormData] = useState<CustomerInput>({
        gender: 'Male',
        SeniorCitizen: 'No',
        Partner: 'No',
        Dependents: 'No',
        tenure: 12,
        PhoneService: 'Yes',
        MultipleLines: 'No',
        InternetService: 'Fiber optic',
        OnlineSecurity: 'No',
        OnlineBackup: 'No',
        DeviceProtection: 'No',
        TechSupport: 'No',
        StreamingTV: 'No',
        StreamingMovies: 'No',
        Contract: 'Month-to-month',
        PaperlessBilling: 'Yes',
        PaymentMethod: 'Electronic check',
        MonthlyCharges: 70.0,
        TotalCharges: 840.0,
    });

    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: keyof CustomerInput, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-calculate TotalCharges based on tenure and MonthlyCharges
        if (field === 'tenure' || field === 'MonthlyCharges') {
            const tenure = field === 'tenure' ? Number(value) : formData.tenure;
            const monthly = field === 'MonthlyCharges' ? Number(value) : formData.MonthlyCharges;
            setFormData(prev => ({ ...prev, TotalCharges: tenure * monthly }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            const result = await api.predictChurn(formData);
            setPrediction(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get prediction');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'High': return 'text-red-600 bg-red-50 border-red-200';
            case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'Low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customer Churn Prediction</h1>
                    <p className="text-muted-foreground mt-2">
                        Enter customer details to predict churn probability
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                        <CardDescription>Fill in the customer details below</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Demographics */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Demographics</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="SeniorCitizen">Senior Citizen</Label>
                                        <Select value={formData.SeniorCitizen} onValueChange={(v) => handleInputChange('SeniorCitizen', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="Partner">Has Partner</Label>
                                        <Select value={formData.Partner} onValueChange={(v) => handleInputChange('Partner', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="Dependents">Has Dependents</Label>
                                        <Select value={formData.Dependents} onValueChange={(v) => handleInputChange('Dependents', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Account Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tenure">Tenure (months)</Label>
                                        <Input
                                            id="tenure"
                                            type="number"
                                            min="0"
                                            max="72"
                                            value={formData.tenure}
                                            onChange={(e) => handleInputChange('tenure', parseInt(e.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="Contract">Contract Type</Label>
                                        <Select value={formData.Contract} onValueChange={(v) => handleInputChange('Contract', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Month-to-month">Month-to-month</SelectItem>
                                                <SelectItem value="One year">One year</SelectItem>
                                                <SelectItem value="Two year">Two year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="MonthlyCharges">Monthly Charges ($)</Label>
                                        <Input
                                            id="MonthlyCharges"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.MonthlyCharges}
                                            onChange={(e) => handleInputChange('MonthlyCharges', parseFloat(e.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="TotalCharges">Total Charges ($)</Label>
                                        <Input
                                            id="TotalCharges"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.TotalCharges}
                                            onChange={(e) => handleInputChange('TotalCharges', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Services */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Services</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="PhoneService">Phone Service</Label>
                                        <Select value={formData.PhoneService} onValueChange={(v) => handleInputChange('PhoneService', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="MultipleLines">Multiple Lines</Label>
                                        <Select value={formData.MultipleLines} onValueChange={(v) => handleInputChange('MultipleLines', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                                <SelectItem value="No phone service">No phone service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="InternetService">Internet Service</Label>
                                        <Select value={formData.InternetService} onValueChange={(v) => handleInputChange('InternetService', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DSL">DSL</SelectItem>
                                                <SelectItem value="Fiber optic">Fiber optic</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="OnlineSecurity">Online Security</Label>
                                        <Select value={formData.OnlineSecurity} onValueChange={(v) => handleInputChange('OnlineSecurity', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                                <SelectItem value="No internet service">No internet service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="OnlineBackup">Online Backup</Label>
                                        <Select value={formData.OnlineBackup} onValueChange={(v) => handleInputChange('OnlineBackup', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                                <SelectItem value="No internet service">No internet service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="DeviceProtection">Device Protection</Label>
                                        <Select value={formData.DeviceProtection} onValueChange={(v) => handleInputChange('DeviceProtection', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                                <SelectItem value="No internet service">No internet service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="TechSupport">Tech Support</Label>
                                        <Select value={formData.TechSupport} onValueChange={(v) => handleInputChange('TechSupport', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                                <SelectItem value="No internet service">No internet service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="StreamingTV">Streaming TV</Label>
                                        <Select value={formData.StreamingTV} onValueChange={(v) => handleInputChange('StreamingTV', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                                <SelectItem value="No internet service">No internet service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="StreamingMovies">Streaming Movies</Label>
                                        <Select value={formData.StreamingMovies} onValueChange={(v) => handleInputChange('StreamingMovies', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                                <SelectItem value="No internet service">No internet service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Billing */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Billing</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="PaperlessBilling">Paperless Billing</Label>
                                        <Select value={formData.PaperlessBilling} onValueChange={(v) => handleInputChange('PaperlessBilling', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="PaymentMethod">Payment Method</Label>
                                        <Select value={formData.PaymentMethod} onValueChange={(v) => handleInputChange('PaymentMethod', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Electronic check">Electronic check</SelectItem>
                                                <SelectItem value="Mailed check">Mailed check</SelectItem>
                                                <SelectItem value="Bank transfer (automatic)">Bank transfer (automatic)</SelectItem>
                                                <SelectItem value="Credit card (automatic)">Credit card (automatic)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Predicting...
                                    </>
                                ) : (
                                    'Predict Churn'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Prediction Result */}
                <div className="space-y-6">
                    {prediction && (
                        <>
                            <Card className={`border-2 ${getRiskColor(prediction.risk_level)}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {prediction.churn_prediction === 1 ? (
                                            <>
                                                <AlertCircle className="h-5 w-5" />
                                                Customer Will CHURN
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-5 w-5" />
                                                Customer Will NOT Churn
                                            </>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Churn Probability</div>
                                        <div className="text-4xl font-bold">
                                            {(prediction.churn_probability * 100).toFixed(1)}%
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-muted-foreground">Risk Level</div>
                                        <div className="text-2xl font-semibold">{prediction.risk_level}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-muted-foreground">Model Used</div>
                                        <div className="font-medium">{prediction.model_name}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {prediction.top_features && prediction.top_features.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            Top Contributing Factors
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {prediction.top_features.slice(0, 5).map((feature, idx) => (
                                                <div key={idx}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="font-medium">{feature.feature}</span>
                                                        <span className="text-muted-foreground">
                                                            {(feature.contribution * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${Math.abs(feature.contribution) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {prediction.recommendations && prediction.recommendations.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recommended Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {prediction.recommendations.map((rec, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-blue-600 mt-1">•</span>
                                                    <span className="text-sm">{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {!prediction && !loading && (
                        <Card className="border-dashed">
                            <CardContent className="pt-6">
                                <div className="text-center text-muted-foreground">
                                    <p>Fill in the customer details and click "Predict Churn" to see results</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
