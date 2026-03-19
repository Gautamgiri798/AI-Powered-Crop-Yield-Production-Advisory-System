"""
Insurance Claims view for KrishiSaarthi.
Manages crop insurance claims under PMFBY.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
import logging

from ..models import InsuranceClaim, Season
from field.models import FieldData

logger = logging.getLogger(__name__)


class InsuranceClaimView(APIView):
    """
    GET: List user's insurance claims
    POST: Create new claim
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List all claims for the user"""
        claims = InsuranceClaim.objects.filter(user=request.user)
        
        # Filter by status if provided
        claim_status = request.query_params.get('status', None)
        if claim_status:
            claims = claims.filter(status=claim_status)
        
        claims_data = []
        for claim in claims:
            claims_data.append({
                'id': claim.id,
                'field_id': claim.field_id,
                'field_name': claim.field.name if claim.field else None,
                'crop': claim.crop,
                'damage_type': claim.damage_type,
                'damage_type_display': claim.get_damage_type_display(),
                'damage_date': claim.damage_date.isoformat(),
                'area_affected_acres': float(claim.area_affected_acres),
                'estimated_loss': float(claim.estimated_loss),
                'claim_amount': float(claim.claim_amount) if claim.claim_amount else None,
                'status': claim.status,
                'status_display': claim.get_status_display(),
                'submitted_at': claim.submitted_at.isoformat() if claim.submitted_at else None,
                'damage_description': claim.damage_description,
                'policy_number': claim.policy_number,
                'bank_account': claim.bank_account,
                'ifsc_code': claim.ifsc_code,
                'created_at': claim.created_at.isoformat(),
            })
        
        # Get summary stats
        total_claims = claims.count()
        pending_claims = claims.filter(status__in=['draft', 'submitted', 'under_review']).count()
        approved_total = sum(
            float(c.claim_amount or 0) for c in claims.filter(status__in=['approved', 'paid'])
        )
        
        response_data = {
            'claims': claims_data,
            'summary': {
                'total_claims': total_claims,
                'pending_claims': pending_claims,
                'approved_total': approved_total,
            },
            'damage_types': [
                {'value': 'flood', 'label': 'Flood', 'icon': '🌊'},
                {'value': 'drought', 'label': 'Drought', 'icon': '☀️'},
                {'value': 'pest', 'label': 'Pest Attack', 'icon': '🐛'},
                {'value': 'disease', 'label': 'Crop Disease', 'icon': '🦠'},
                {'value': 'hail', 'label': 'Hailstorm', 'icon': '🌨️'},
                {'value': 'fire', 'label': 'Fire', 'icon': '🔥'},
                {'value': 'other', 'label': 'Other Natural Calamity', 'icon': '⚠️'},
            ],
            'tips': [
                {
                    'icon': '📸',
                    'text': 'Take photos of crop damage as soon as possible for evidence.',
                },
                {
                    'icon': '📞',
                    'text': 'Report crop loss within 72 hours to your local agriculture office.',
                },
                {
                    'icon': '📋',
                    'text': 'Keep your policy number and bank details ready when filing claims.',
                },
            ],
            'all_plans': [
                {
                    'id': 101,
                    'name': 'PMFBY Kharif 2026',
                    'provider': 'Government of India',
                    'category': 'government',
                    'rating': 4.9,
                    'premium': '2.0% of Sum Insured',
                    'coverage': 'Comprehensive',
                    'full_description': 'The Pradhan Mantri Fasal Bima Yojana (PMFBY) aims at supporting sustainable production in agriculture sector by way of providing financial support to farmers suffering crop loss/damage arising out of unforeseen events.',
                    'benefits': [
                        'Financial support to farmers in case of loss of crops',
                        'Stabilizing income of farmers',
                        'Encouraging farmers to adopt innovative and modern agricultural practices',
                        'Ensuring flow of credit to the agriculture sector'
                    ],
                    'eligibility': 'All farmers including sharecroppers and tenant farmers growing the notified crops in the notified areas are eligible.',
                    'tag': 'Best Value',
                    'icon': '🛡️'
                },
                {
                    'id': 102,
                    'name': 'Weather Based Protection',
                    'provider': 'AIC of India',
                    'category': 'government',
                    'rating': 4.7,
                    'premium': 'Market Linked',
                    'coverage': 'Drought & Flood',
                    'full_description': 'Restructured Weather Based Crop Insurance Scheme (RWBCIS) aims to mitigate the hardship of the insured farmers against the likelihood of financial loss on account of anticipated crop loss resulting from adverse weather conditions.',
                    'benefits': [
                        'Parametric insurance based on weather indices',
                        'Faster claim settlement process',
                        'Protection against localized calamities',
                        'Covers multiple weather perils like unseasonal rain, high temp, etc.'
                    ],
                    'eligibility': 'Applicable for all farmers growing notified crops in specified areas with weather stations.',
                    'tag': 'Popular',
                    'icon': '☁️'
                },
                {
                    'id': 103,
                    'name': 'Horticulture Cover',
                    'provider': 'HDFC ERGO',
                    'category': 'private',
                    'rating': 4.8,
                    'premium': 'Flexible',
                    'coverage': 'High Value Crops',
                    'full_description': 'Specialized insurance for high-value horticultural crops including fruits and vegetables. Protects against yield loss due to non-preventable risks.',
                    'benefits': [
                        'Customized for specific fruit/vegetable cycles',
                        'Covers pest infestation and specialized diseases',
                        'Post-harvest loss coverage available',
                        'Expert advisory services included'
                    ],
                    'eligibility': 'Commercial horticulture farmers with minimum 1 acre land.',
                    'tag': 'Premium',
                    'icon': '🍎'
                },
                {
                    'id': 104,
                    'name': 'Organic Crop Shield',
                    'provider': 'ICICI Lombard',
                    'category': 'private',
                    'rating': 4.6,
                    'premium': 'Moderate',
                    'coverage': 'Organic certified crops',
                    'full_description': 'Tailored insurance for certified organic farmers. Recognizes the higher value and different risk profiles of organic farming.',
                    'benefits': [
                        'Higher sum insured matching organic market prices',
                        'Coverage for organic input certification loss',
                        'Biosecurity breach protection',
                        'Priority claim handling'
                    ],
                    'eligibility': 'Farmers with valid NPOP or equivalent organic certification.',
                    'tag': 'New',
                    'icon': '🌿'
                },
                {
                    'id': 105,
                    'name': 'Livestock & Cattle Cover',
                    'provider': 'SBI General',
                    'category': 'private',
                    'rating': 4.5,
                    'premium': 'Low',
                    'coverage': 'Animal health & life',
                    'full_description': 'Protection for your valuable livestock against death due to accident, diseases, and natural calamities.',
                    'benefits': [
                        'Coverage for various cattle breeds',
                        'Quick verification and payout',
                        'Emergency vet expenses covered',
                        'Available for individual and group farmers'
                    ],
                    'eligibility': 'Owners of milch cows, buffaloes, and other notified livestock.',
                    'tag': 'Essential',
                    'icon': '🐄'
                },
                {
                    'id': 106,
                    'name': 'Unified Package (UPIS)',
                    'provider': 'Govt + Multi-Agency',
                    'category': 'government',
                    'rating': 4.4,
                    'premium': 'Subsidized',
                    'coverage': 'Multiple Risks',
                    'full_description': 'A unified package policy covering crop insurance along with personal accident, life, and dwelling insurance for the farmer.',
                    'benefits': [
                        'Single window for multiple insurance needs',
                        'Unified premium collection',
                        'Higher social security coverage',
                        'Automated enrollment for KCC holders'
                    ],
                    'eligibility': 'Farmers holding Kisan Credit Cards (KCC) are prioritized.',
                    'tag': 'National',
                    'icon': '📦'
                }
            ]
        }
        
        # Dynamically pick top plans based on rating
        all_plans = response_data['all_plans']
        response_data['top_plans'] = sorted(all_plans, key=lambda x: x['rating'], reverse=True)[:3]
        
        return Response(response_data)
    
    def post(self, request):
        """Create a new insurance claim"""
        try:
            data = request.data
            
            # Validate required fields
            required_fields = ['field_id', 'crop', 'damage_type', 'damage_date', 
                             'area_affected_acres', 'damage_description', 'estimated_loss']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'Missing required field: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get the field
            field = get_object_or_404(FieldData, id=data['field_id'], user=request.user)
            
            # Get season if provided
            season = None
            if 'season_id' in data and data['season_id']:
                season = get_object_or_404(Season, id=data['season_id'], user=request.user)
            
            # Create the claim
            claim = InsuranceClaim.objects.create(
                user=request.user,
                field=field,
                season=season,
                policy_number=data.get('policy_number', ''),
                crop=data['crop'],
                area_affected_acres=data['area_affected_acres'],
                damage_type=data['damage_type'],
                damage_date=data['damage_date'],
                damage_description=data['damage_description'],
                estimated_loss=data['estimated_loss'],
                bank_account=data.get('bank_account', ''),
                ifsc_code=data.get('ifsc_code', ''),
                status='draft'
            )
            
            logger.info(f"Created insurance claim {claim.id} for user {request.user.username}")
            
            return Response({
                'message': 'Claim created successfully',
                'claim_id': claim.id,
                'status': claim.status,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating insurance claim: {e}")
            return Response(
                {'error': 'Failed to create claim', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InsuranceClaimDetailView(APIView):
    """
    GET: Get claim details
    PATCH: Update claim
    DELETE: Delete draft claim
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, claim_id):
        """Get claim details"""
        claim = get_object_or_404(InsuranceClaim, id=claim_id, user=request.user)
        
        return Response({
            'id': claim.id,
            'field_id': claim.field_id,
            'field_name': claim.field.name if claim.field else None,
            'season_id': claim.season_id,
            'policy_number': claim.policy_number,
            'crop': claim.crop,
            'damage_type': claim.damage_type,
            'damage_type_display': claim.get_damage_type_display(),
            'damage_date': claim.damage_date.isoformat(),
            'damage_description': claim.damage_description,
            'area_affected_acres': float(claim.area_affected_acres),
            'estimated_loss': float(claim.estimated_loss),
            'claim_amount': float(claim.claim_amount) if claim.claim_amount else None,
            'status': claim.status,
            'status_display': claim.get_status_display(),
            'submitted_at': claim.submitted_at.isoformat() if claim.submitted_at else None,
            'reviewed_at': claim.reviewed_at.isoformat() if claim.reviewed_at else None,
            'reviewer_notes': claim.reviewer_notes,
            'bank_account': claim.bank_account,
            'ifsc_code': claim.ifsc_code,
            'created_at': claim.created_at.isoformat(),
            'updated_at': claim.updated_at.isoformat(),
        })
    
    def patch(self, request, claim_id):
        """Update a claim (only draft claims can be fully edited)"""
        claim = get_object_or_404(InsuranceClaim, id=claim_id, user=request.user)
        data = request.data
        
        # Allow editing draft and submitted claims
        if claim.status not in ['draft', 'submitted'] and 'status' not in data:
            return Response(
                {'error': 'Only draft or submitted claims can be edited'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle status change (submit claim)
        if 'status' in data:
            if data['status'] == 'submitted' and claim.status == 'draft':
                claim.status = 'submitted'
                claim.submitted_at = timezone.now()
                claim.save()
                return Response({
                    'message': 'Claim submitted successfully',
                    'claim_id': claim.id,
                    'status': claim.status,
                })
        
        # Update allowed fields
        update_fields = ['crop', 'damage_type', 'damage_date', 'damage_description',
                        'area_affected_acres', 'estimated_loss', 'policy_number',
                        'bank_account', 'ifsc_code']
        
        for field in update_fields:
            if field in data:
                setattr(claim, field, data[field])
        
        claim.save()
        
        return Response({
            'message': 'Claim updated successfully',
            'claim_id': claim.id,
        })
    
    def delete(self, request, claim_id):
        """Delete a draft claim"""
        claim = get_object_or_404(InsuranceClaim, id=claim_id, user=request.user)
        
        if claim.status not in ['draft', 'submitted']:
            return Response(
                {'error': 'Only draft or submitted claims can be deleted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        claim.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
