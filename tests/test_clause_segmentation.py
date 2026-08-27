from agent import segmentation


def test_extracts_clause_headers_and_segments_text():
    contract_text = '''
    SECTION 1. DEFINITIONS.
    The supplier shall provide services.

    CLAUSE 2. LIABILITY.
    The provider shall indemnify the customer for third-party claims.

    3. NON-COMPETE.
    The employee shall not compete for 24 months.
    '''

    segments = segmentation.segment_contract(contract_text)

    assert len(segments) >= 3
    assert any(item["title"].lower().find("definitions") >= 0 for item in segments)
    assert any(item["title"].lower().find("liability") >= 0 for item in segments)
    assert all(item["text"].strip() for item in segments)
